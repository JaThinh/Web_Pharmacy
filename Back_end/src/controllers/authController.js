const db = require("../../db_config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const TOKEN_EXPIRES = "7d";

// Helper query
const dbQuery = async (sql, params) => {
  if (db?.query) return db.query(sql, params);
  if (db?.pool?.query) return db.pool.query(sql, params);
  throw new Error("DB chưa export đúng, không tìm thấy query");
};

// Tạo token - Dùng Id và Role (PascalCase) để đồng bộ với controllers
const generateToken = (id, role) =>
  jwt.sign({ Id: id, Role: role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// Loại bỏ password khi trả về
const excludePassword = (userObj = {}) => {
  const { Password, PasswordHash, ...user } = userObj;
  return user;
};

// Kiểm tra tồn tại
const checkExists = async (field, value) => {
  const result = await dbQuery(
    `SELECT "Id" FROM public."Users" WHERE "${field}"=$1`,
    [value]
  );
  
  // Handle both SQL Server (recordset) and PostgreSQL (rows) formats
  const data = result.rows || result.recordset || [];
  return data.length > 0;
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    let { username, fullname, email, phone, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });

    email = email.toLowerCase().trim();

    if (await checkExists("Email", email))
      return res.status(400).json({ error: "Email đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);
    const finalUsername = username?.trim() || email.split("@")[0];

    if (await checkExists("Username", finalUsername))
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });

    const sql = `
      INSERT INTO public."Users" ("Username","Password","FullName","Email","Phone","Role")
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;
    const result = await dbQuery(sql, [
      finalUsername,
      hashed,
      fullname || "(Chưa cập nhật)",
      email,
      phone || null,
      "customer",
    ]);
    
    // Handle both SQL Server (recordset) and PostgreSQL (rows) formats
    let data = result.rows || result.recordset || [];
    let user = data[0];

    if (!user) {
      const lookup = await dbQuery('SELECT * FROM public."Users" WHERE LOWER("Email")=$1', [email]);
      const lookupData = lookup.rows || lookup.recordset || [];
      user = lookupData[0];
    }

    if (!user) {
      return res.status(500).json({ error: "Không tạo được tài khoản. Vui lòng thử lại." });
    }

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        id: user.Id,
        username: user.Username,
        fullname: user.FullName || user.Fullname,
        email: user.Email,
        role: user.Role,
        Role: user.Role, 
      },
      token: generateToken(user.Id, user.Role),
    });
  } catch (err) {
    console.error("❌ Lỗi register:", err);
    res.status(500).json({ error: "Lỗi server khi đăng ký" });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });

    email = email.toLowerCase().trim();

    const result = await dbQuery(
      'SELECT * FROM public."Users" WHERE LOWER("Email")=$1',
      [email]
    );

    // Handle both SQL Server (recordset) and PostgreSQL (rows) formats
    const data = result.rows || result.recordset || [];
    if (!data.length)
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });

    const user = data[0];
    const isMatch = await bcrypt.compare(password, user.Password || user.PasswordHash);

    if (!isMatch)
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" });

    res.status(200).json({
      message: "Đăng nhập thành công",
      token: generateToken(user.Id, user.Role),
      user: {
        id: user.Id,
        username: user.Username,
        fullname: user.FullName || user.Fullname,
        email: user.Email,
        role: user.Role,
        Role: user.Role, 
      },
    });
  } catch (err) {
    console.error("❌ Lỗi login:", err);
    res.status(500).json({ error: "Lỗi server khi đăng nhập" });
  }
};
// ================= CREATE ADMIN =================
const createAdmin = async (req, res) => {
  try {
    let { email, password, fullname } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Thiếu email hoặc mật khẩu" });

    email = email.toLowerCase().trim();

    if (await checkExists("Role", "admin"))
      return res.status(409).json({ error: "Admin đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO public."Users" ("Username","Password","FullName","Email","Phone","Role")
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
    `;
    const result = await dbQuery(sql, [
      "admin",
      hashed,
      fullname || "Quản trị viên",
      email,
      null,
      "admin",
    ]);

    let data = result.rows || result.recordset || [];
    let admin = data[0];

    if (!admin) {
      const lookup = await dbQuery('SELECT * FROM public."Users" WHERE LOWER("Email")=$1', [email]);
      const lookupData = lookup.rows || lookup.recordset || [];
      admin = lookupData[0];
    }

    if (!admin) {
      return res.status(500).json({ error: "Không tạo được admin. Vui lòng thử lại." });
    }
    res.status(201).json({
      message: "Admin đã tạo",
      admin: excludePassword(admin),
      token: generateToken(admin.Id, admin.Role),
    });
  } catch (err) {
    console.error("❌ Lỗi createAdmin:", err);
    res.status(500).json({ error: "Lỗi server khi tạo admin" });
  }
};

module.exports = { registerUser, loginUser, createAdmin };
