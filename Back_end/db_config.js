require('dotenv').config({ override: true });
const sql = require('mssql/msnodesqlv8');
const { mockData } = require('./src/middleware/mockData');

const parseServer = (value) => {
  if (!value) return { server: 'localhost', instanceName: null };
  if (value.includes('\\')) {
    const [server, instanceName] = value.split('\\');
    return { server, instanceName: instanceName || null };
  }
  return { server: value, instanceName: process.env.DB_INSTANCE || null };
};

const buildSqlConfig = () => {
  const dbName = process.env.DB_NAME || 'pharmacy_db';
  const dbUser = (process.env.DB_USER || '').trim();
  const dbPass = (process.env.DB_PASS || '').trim();
  const encrypt = String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true';
  const forceWindowsAuth = String(process.env.DB_USE_WINDOWS_AUTH || '').toLowerCase() === 'true';
  const useWindowsAuth = forceWindowsAuth || (!dbUser && !dbPass);

  if (!useWindowsAuth) {
    const { server, instanceName } = parseServer(process.env.DB_HOST || 'localhost');
    const config = {
      server,
      database: dbName,
      user: dbUser,
      password: dbPass || '',
      options: {
        encrypt,
        trustServerCertificate: true,
        enableArithAbort: true
      }
    };

    if (process.env.DB_PORT) {
      config.port = Number(process.env.DB_PORT);
    }

    if (instanceName) {
      config.options.instanceName = instanceName;
    }

    return config;
  }

  // Windows Authentication (Shared Memory via ODBC connection string)
  const serverName = process.env.DB_HOST && process.env.DB_HOST.trim().length > 0
    ? process.env.DB_HOST.trim()
    : '(local)';

  const connParts = [
    'Driver={SQL Server}',
    `Server=${serverName}`,
    `Database=${dbName}`,
    'Trusted_Connection=Yes',
    'TrustServerCertificate=Yes'
  ];

  if (encrypt) {
    connParts.push('Encrypt=Yes');
  }

  return {
    connectionString: connParts.join(';')
  };
};

let pool;
let dbConnected = false;

const initializePool = async () => {
  try {
    const config = buildSqlConfig();
    pool = await new sql.ConnectionPool(config).connect();
    dbConnected = true;
    console.log('✅ Connected to SQL Server database!');
    return pool;
  } catch (err) {
    dbConnected = false;
    console.warn('⚠️  Database connection not available:', err.message);
    console.warn('⚠️  Using mock data for API responses');
    return null;
  }
};

// Initialize pool on startup (don't wait)
initializePool();

const buildOutputClause = (returning, kind) => {
  const clean = returning.replace(/;$/, '').trim();
  if (!clean || clean === '*') return `OUTPUT ${kind}.*`;

  const cols = clean.split(',').map((c) => {
    let col = c.trim();
    if (!col) return null;
    col = col.replace(/\[[^\]]+\]\./g, ''); // remove table alias
    col = col.replace(/[\[\]]/g, '');
    return `${kind}.[${col}]`;
  }).filter(Boolean);

  return `OUTPUT ${cols.join(', ')}`;
};

const toSqlServerQuery = (queryString) => {
  let sqlText = queryString;

  // Capture RETURNING clause (PostgreSQL)
  let returning = null;
  const returningMatch = sqlText.match(/\s+RETURNING\s+([\s\S]+?)\s*;?\s*$/i);
  if (returningMatch) {
    returning = returningMatch[1];
    sqlText = sqlText.replace(/\s+RETURNING\s+([\s\S]+?)\s*;?\s*$/i, '');
  }

  // Replace schema and identifiers
  sqlText = sqlText.replace(/public\./gi, '');
  sqlText = sqlText.replace(/"([^"]+)"/g, '[$1]');

  // Map Password column to PasswordHash (SQL Server schema)
  sqlText = sqlText.replace(/\[Password\]/gi, '[PasswordHash]');

  // Replace booleans and functions
  sqlText = sqlText.replace(/\btrue\b/gi, '1');
  sqlText = sqlText.replace(/\bfalse\b/gi, '0');
  sqlText = sqlText.replace(/\bNOW\(\)/gi, 'GETDATE()');
  sqlText = sqlText.replace(/\bCURRENT_DATE\b/gi, 'CAST(GETDATE() AS DATE)');
  sqlText = sqlText.replace(/DATE\(\[([^\]]+)\]\)/gi, 'CAST([$1] AS DATE)');

  // Replace LEAST(a,b) with CASE WHEN a < b THEN a ELSE b END
  sqlText = sqlText.replace(/LEAST\(([^,]+),([^)]+)\)/gi, 'CASE WHEN $1 < $2 THEN $1 ELSE $2 END');

  // Replace $1 style params -> @param0
  sqlText = sqlText.replace(/\$(\d+)/g, (_, n) => `@param${Number(n) - 1}`);

  // Convert LIMIT/OFFSET to OFFSET/FETCH (requires ORDER BY)
  sqlText = sqlText.replace(
    /ORDER BY([\s\S]+?)LIMIT\s+(@param\d+)\s+OFFSET\s+(@param\d+)/i,
    (_m, orderBy, limit, offset) => `ORDER BY${orderBy} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
  );

  // Apply RETURNING -> OUTPUT for SQL Server
  if (returning) {
    if (/^\s*insert/i.test(sqlText)) {
      const output = buildOutputClause(returning, 'INSERTED');
      sqlText = sqlText.replace(/\bVALUES\b/i, `${output} VALUES`);
    } else if (/^\s*update/i.test(sqlText)) {
      const output = buildOutputClause(returning, 'INSERTED');
      if (/\bWHERE\b/i.test(sqlText)) {
        sqlText = sqlText.replace(/\bWHERE\b/i, `${output} WHERE`);
      } else {
        sqlText = `${sqlText} ${output}`;
      }
    } else if (/^\s*delete/i.test(sqlText)) {
      const output = buildOutputClause(returning, 'DELETED');
      sqlText = sqlText.replace(/DELETE\s+FROM\s+([^\s]+)/i, `DELETE FROM $1 ${output}`);
    }
  }

  return sqlText;
};

const queryWithMock = (queryString, params = []) => {
  console.warn('⚠️  [USING MOCK DATA]', queryString.substring(0, 50));

  const q = queryString.toLowerCase();
  let recordset = [];

  if (q.includes('users') && q.includes('email')) {
    if (params && params[0]) {
      const email = String(params[0]).toLowerCase();
      recordset = mockData.users.filter((u) => u.Email.toLowerCase() === email);
    }
  } else if (q.includes('users') && q.includes('"id"')) {
    if (params && params[0] !== undefined) {
      const id = Number(params[0]);
      recordset = mockData.users.filter((u) => Number(u.Id) === id);
    }
  } else if (q.includes('insert') && q.includes('users')) {
    const newUser = {
      Id: Math.floor(Math.random() * 100000),
      Username: params[0] || 'newuser',
      Password: params[1] || 'hashed',
      PasswordHash: params[1] || 'hashed',
      FullName: params[2] || 'User',
      Fullname: params[2] || 'User',
      Email: params[3] || 'user@example.com',
      Phone: params[4] || null,
      Address: null,
      Avatar: null,
      Role: params[5] || 'customer',
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };
    mockData.users.push(newUser);
    recordset = [newUser];
  } else if (q.includes('announcements')) {
    recordset = mockData.announcements;
  } else if (q.includes('cartitems')) {
    const cartItems = mockData.cartItems || (mockData.cartItems = []);
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    if (q.includes('select')) {
      let rows = [];
      if (q.includes('join') && q.includes('products')) {
        let filterUserId = null;
        let filterCartId = null;

        if (q.includes('where ci."userid" = $1') || q.includes('where ci.[userid] = @param0')) {
          filterUserId = toNumber(params[0]);
        }
        if (q.includes('where ci."id" = $1') || q.includes('where ci.[id] = @param0')) {
          filterCartId = toNumber(params[0]);
          filterUserId = toNumber(params[1]);
        }

        const filtered = cartItems.filter((ci) => {
          if (filterUserId !== null && ci.UserId !== filterUserId) return false;
          if (filterCartId !== null && ci.Id !== filterCartId) return false;
          return true;
        });

        rows = filtered.map((ci) => {
          const product = mockData.products.find((p) => p.Id === ci.ProductId) || {};
          return {
            Id: ci.Id,
            ProductId: ci.ProductId,
            Qty: ci.Qty,
            ProductName: product.Name,
            ProductImage: product.Image,
            ProductImageURL: product.ImageURL || product.ImageUrl || null,
            Price: product.Price,
            Stock: product.Stock,
            Subtotal: (ci.Qty || 0) * (product.Price || 0)
          };
        });
      } else {
        let filterUserId = null;
        let filterProductId = null;

        if (q.includes('"userid"') && q.includes('"productid"')) {
          filterUserId = toNumber(params[0]);
          filterProductId = toNumber(params[1]);
        }

        rows = cartItems.filter((ci) => {
          if (filterUserId !== null && ci.UserId !== filterUserId) return false;
          if (filterProductId !== null && ci.ProductId !== filterProductId) return false;
          return true;
        }).map((ci) => ({ Id: ci.Id, Qty: ci.Qty }));
      }

      if (q.includes('order by') && q.includes('id') && q.includes('desc')) {
        rows = rows.sort((a, b) => (b.Id || 0) - (a.Id || 0));
      }

      recordset = rows;
    } else if (q.includes('insert')) {
      const userId = toNumber(params[0]);
      const productId = toNumber(params[1]);
      const qty = toNumber(params[2]) || 1;
      const nextId = cartItems.reduce((m, ci) => Math.max(m, ci.Id || 0), 0) + 1;

      cartItems.push({ Id: nextId, UserId: userId, ProductId: productId, Qty: qty });
      recordset = [{ Id: nextId, Qty: qty }];
    } else if (q.includes('update')) {
      if (q.includes('where') && q.includes('id')) {
        const newQty = toNumber(params[0]);
        const cartId = toNumber(params[1]);
        const item = cartItems.find((ci) => ci.Id === cartId);
        if (item && newQty !== null) item.Qty = newQty;
        recordset = item ? [{ Id: item.Id, Qty: item.Qty }] : [];
      }
    } else if (q.includes('delete')) {
      if (q.includes('where') && q.includes('id')) {
        const cartId = toNumber(params[0]);
        const idx = cartItems.findIndex((ci) => ci.Id === cartId);
        if (idx >= 0) cartItems.splice(idx, 1);
      }
    }
  } else if (q.includes('products')) {
    recordset = mockData.products;
  } else if (q.includes('diseases')) {
    recordset = mockData.diseases;
  }

  return {
    recordset,
    rows: recordset
  };
};

const query = async (queryString, params = []) => {
  if (!pool || !dbConnected) {
    return queryWithMock(queryString, params);
  }

  try {
    const request = pool.request();
    if (params && Array.isArray(params)) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }

    const sqlText = toSqlServerQuery(queryString);
    const result = await request.query(sqlText);
    const recordset = result.recordset || [];
    return { rows: recordset, recordset };
  } catch (err) {
    console.error('Query error:', err.message);
    dbConnected = false;
    return queryWithMock(queryString, params);
  }
};

module.exports = {
  query,
  pool,
  sql,
  isConnected: () => dbConnected
};
