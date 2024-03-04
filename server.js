const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secret = "secret";
const crypto = require('crypto');

// Example usage
const password = 'password';
const amountToEncrypt = 100;

const deriveKeyFromPassword = (password, salt, iterations, keyLength) => {
  return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
};

const encrypt = (data, password) => {
  const algorithm = 'aes-256-cbc';
  const salt = crypto.randomBytes(16);
  const key = deriveKeyFromPassword(password, salt, 100000, 32); // Adjust iterations as needed
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(data.toString(), 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encryptedData: encrypted,
  };
};

const decrypt = (encryptedData, password, salt, iv) => {
  const algorithm = 'aes-256-cbc';
  const key = deriveKeyFromPassword(password, Buffer.from(salt, 'hex'), 100000, 32);
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return parseInt(decrypted, 10);
};

// Encrypt the amount
const encryptedData = encrypt(amountToEncrypt, password);
console.log('Encrypted Data:', encryptedData);

// Decrypt the amount
const decryptedAmount = decrypt(encryptedData.encryptedData, password, encryptedData.salt, encryptedData.iv);
console.log('Decrypted Amount:', decryptedAmount);

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// ROUTES

// Fetch User Information by user_id
app.get("/user/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    // Step 1: Check if the user with the provided user_id exists
    const user = await pool.query("SELECT user_id,name,email,isHead FROM users WHERE user_id = $1", [
      user_id,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json("User not found");
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// User Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Check if the user with the provided email exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Invalid Credentials");
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(401).json("Invalid Credentials");
    }

    // Step 2: Generate a JWT token for authentication
    const token = jwt.sign(
      { user_id: user.rows[0].user_id, email: user.rows[0].email },
      secret,
      { expiresIn: "1h" }
    );

    // Include user_id in the response
    res.json({ user_id: user.rows[0].user_id, token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// User Signup
app.post("/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Step 1: Check if the user with the provided email already exists
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
  
      if (existingUser.rows.length > 0) {
        return res.status(400).json("User already exists with this email");
      }
  
      // Step 2: Encrypt the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Step 3: Add the user with encrypted password to the database
      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, isHead) VALUES($1, $2, $3, $4) RETURNING *",
        [username, email, hashedPassword, 1]
      );
  
      res.json(newUser.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

// Add User
app.post("/users", async (req, res) => {
  try {
    const { username, password, email} = req.body;

    const newUser = await pool.query(
      "INSERT INTO users (name, password, email, isHead) VALUES($1, $2, $3, $4) RETURNING *",
      [username, password, email, 1]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add Family Member
app.post("/family-members", async (req, res) => {
    try {
      const { member_name, relationship, user_id, member_password, member_email } = req.body;
  
      // Step 1: Check if the family member with the provided email already exists
      const existingMember = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [member_email]
      );
  
      if (existingMember.rows.length > 0) {
        return res.status(400).json("Family member already exists with this email");
      }
  
      // Step 2: Encrypt the family member's password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(member_password, saltRounds);
  
      // Step 3: Add a new user (family member)
      const newUser = await pool.query(
        "INSERT INTO users (name, password, email, isHead) VALUES($1, $2, $3, $4) RETURNING user_id",
        [member_name, hashedPassword, member_email, 0]
      );
  
      const member_id = newUser.rows[0].user_id;
  
      // Step 4: Add a new family member
      const newFamilyMember = await pool.query(
        "INSERT INTO family_members (member_id, user_id, relationship, member_name) VALUES($1, $2, $3, $4) RETURNING *",
        [member_id, user_id, relationship, member_name]
      );
  
      res.json(newFamilyMember.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
  
// Add Budget
app.post("/budgets", async (req, res) => {
  try {
    const { user_id, budget_name, budget_amount } = req.body;

    // Use separate encryption for budget_amount and budget_remaining
    const encryptedBudgetAmount = encrypt(budget_amount, password);
    const encryptedBudgetRemaining = encrypt(budget_amount, password);

    const newBudget = await pool.query(
      "INSERT INTO budgets (user_id, budget_name, budget_amount, budget_remaining, amount_salt, amount_iv, remaining_salt, remaining_iv) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        user_id,
        budget_name,
        encryptedBudgetAmount.encryptedData,
        encryptedBudgetRemaining.encryptedData,
        encryptedBudgetAmount.salt,
        encryptedBudgetAmount.iv,
        encryptedBudgetRemaining.salt,
        encryptedBudgetRemaining.iv,
      ]
    );

    res.json(newBudget.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
  
// Add Expense
app.post("/expenses", async (req, res) => {
  try {
    const { user_id, budget_id, expense_name, expense_amount } = req.body;

    // Encrypt expense_amount
    const encryptedData = encrypt(expense_amount, password);
    const expense_encr = encryptedData.encryptedData;
    const expense_salt = encryptedData.salt;
    const expense_iv = encryptedData.iv;

    // Step 1: Insert the new expense
    console.log("Reached Step 1");
    const newExpense = await pool.query(
      "INSERT INTO expenses (user_id, budget_id, expense_name, expense_amount, expense_salt, expense_iv) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [user_id, budget_id, expense_name, expense_encr, expense_salt, expense_iv]
    );

    // Step 2: Update the budget_remaining in the corresponding budget
    console.log("Reached Step 2");
    const budgetData = await pool.query(
      "SELECT budget_amount, amount_salt, amount_iv FROM budgets WHERE budget_id = $1",
      [budget_id]
    );
    
    console.log("Budget Data:", budgetData.rows);
    
    console.log("Reached Step 3");
    const decryptedAmount = decrypt(
      budgetData.rows[0].budget_amount, // Access the result from rows
      password,
      budgetData.rows[0].amount_salt,
      budgetData.rows[0].amount_iv
    );
    const remaining_budget = decryptedAmount - expense_amount;
    console.log("Reached Step 4");
    const encryptedRem = encrypt(remaining_budget, password);
    const rem_encr = encryptedRem.encryptedData;
    const rem_salt = encryptedRem.salt;
    const rem_iv = encryptedRem.iv;
    console.log("Reached Step 5");
    const updateBudgetRemaining = await pool.query(
      "UPDATE budgets SET budget_remaining = $1, remaining_salt = $2, remaining_iv = $3 WHERE budget_id = $4",
      [rem_encr, rem_salt, rem_iv, budget_id]
    );

    res.json(newExpense.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Family Members by User ID
app.get("/family-members/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const familyMembers = await pool.query(
      "SELECT member_id, member_name FROM family_members WHERE user_id = $1",
      [user_id]
    );

    res.json(familyMembers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Budgets by User ID 
app.get("/budgets/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch encrypted budgets from the database
    const encryptedBudgets = await pool.query(
      "SELECT * FROM budgets WHERE user_id = $1",
      [user_id]
    );

    // Decrypt the budgets before sending to the client
    const decryptedBudgets = encryptedBudgets.rows.map((budget) => {
      return {
        ...budget,
        budget_amount: decrypt(
          budget.budget_amount,
          password,
          budget.amount_salt,
          budget.amount_iv
        ),
        budget_remaining: decrypt(
          budget.budget_remaining,
          password,
          budget.remaining_salt,
          budget.remaining_iv
        ),
      };
    });

    res.json(decryptedBudgets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Expense Details by User ID
app.get("/expenses/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch encrypted expenses from the database
    const encryptedExpenses = await pool.query(
      "SELECT e.expense_id, e.expense_name, e.expense_amount, b.budget_name, b.amount_salt, b.amount_iv, e.expense_salt, e.expense_iv FROM expenses e JOIN budgets b ON e.budget_id = b.budget_id WHERE e.user_id = $1",
      [user_id]
    );

    // Decrypt the expenses before sending to the client
    const decryptedExpenses = encryptedExpenses.rows.map((expense) => {
      return {
        expense_id : expense.expense_id,
        expense_name: expense.expense_name,
        expense_amount: decrypt(
          expense.expense_amount,
          password,
          expense.expense_salt,
          expense.expense_iv
        ),
        budget_name: expense.budget_name,
      };
    });

    res.json(decryptedExpenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Budget and Associated Expenses
app.delete("/budgets/:user_id/:budget_id", async (req, res) => {
  try {
    const { user_id, budget_id } = req.params;

    // Step 1: Check if the budget with the provided budget_id exists
    const budgetExists = await pool.query("SELECT * FROM budgets WHERE budget_id = $1 AND user_id = $2", [
      budget_id, user_id
    ]);

    if (budgetExists.rows.length === 0) {
      return res.status(404).json("Budget not found");
    }

    // Step 2: Delete associated expenses
    const deleteExpenses = await pool.query("DELETE FROM expenses WHERE budget_id = $1", [budget_id]);

    // Step 3: Delete the budget
    const deleteBudget = await pool.query("DELETE FROM budgets WHERE budget_id = $1", [budget_id]);

    res.json({ message: "Budget and associated expenses deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Expense and Update Remaining Budget
app.delete("/expenses/:user_id/:expense_id", async (req, res) => {
  try {
    const { user_id, expense_id } = req.params;

    // Step 1: Check if the expense with the provided expense_id exists
    const expenseExists = await pool.query("SELECT * FROM expenses WHERE expense_id = $1 AND user_id = $2", [
      expense_id, user_id
    ]);

    if (expenseExists.rows.length === 0) {
      return res.status(404).json("Expense not found");
    }

    // Step 2: Get the budget_id associated with the expense
    const budgetIdResult = await pool.query("SELECT budget_id FROM expenses WHERE expense_id = $1", [expense_id]);
    const budget_id = budgetIdResult.rows[0].budget_id;

    // Step 3: Get the current budget_remaining for the corresponding budget
    const budgetData = await pool.query(
      "SELECT budget_remaining, remaining_salt, remaining_iv FROM budgets WHERE budget_id = $1",
      [budget_id]
    );

    const currentRemainingEncrypted = budgetData.rows[0].budget_remaining;
    const remainingSalt = budgetData.rows[0].remaining_salt;
    const remainingIv = budgetData.rows[0].remaining_iv;

    // Decrypt the current remaining budget
    const currentRemaining = decrypt(currentRemainingEncrypted, password, remainingSalt, remainingIv);

    // Step 4: Get the expense_amount for the expense being deleted
    const expenseData = await pool.query(
      "SELECT expense_amount, expense_salt, expense_iv FROM expenses WHERE expense_id = $1",
      [expense_id]
    );

    const expenseAmountEncrypted = expenseData.rows[0].expense_amount;
    const expenseSalt = expenseData.rows[0].expense_salt;
    const expenseIv = expenseData.rows[0].expense_iv;

    // Decrypt the expense amount
    const expenseAmount = decrypt(expenseAmountEncrypted, password, expenseSalt, expenseIv);

    // Step 5: Update the budget_remaining by adding the decrypted expense_amount
    const newRemaining = currentRemaining + expenseAmount;

    // Encrypt the newRemaining
    const encryptedRemaining = encrypt(newRemaining, password);

    // Update the budget_remaining with the encrypted value
    const updateBudgetRemaining = await pool.query(
      "UPDATE budgets SET budget_remaining = $1, remaining_salt = $2, remaining_iv = $3 WHERE budget_id = $4",
      [encryptedRemaining.encryptedData, encryptedRemaining.salt, encryptedRemaining.iv, budget_id]
    );

    // Step 6: Delete the expense
    const deleteExpense = await pool.query("DELETE FROM expenses WHERE expense_id = $1", [expense_id]);

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add Family Member Alternative
app.post("/family-members-alt", async (req, res) => {
  try {
    const { member_name, relationship, user_id, member_password, member_email } = req.body;

    const existingMember = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [member_email]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json("Family member already exists with this email");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(member_password, saltRounds);

    const newUserResult = await pool.query(
      "INSERT INTO users (name, password, email, isHead) VALUES($1, $2, $3, $4) RETURNING user_id",
      [member_name, hashedPassword, member_email, 0]
    );

    const { user_id: member_id } = newUserResult.rows[0];

    const newFamilyMemberResult = await pool.query(
      "INSERT INTO family_members (member_id, user_id, relationship, member_name) VALUES($1, $2, $3, $4) RETURNING *",
      [member_id, user_id, relationship, member_name]
    );

    res.json(newFamilyMemberResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Budget and Associated Expenses Alternative
app.delete("/budgets-alt/:user_id/:budget_id", (req, res) => {
  const { user_id, budget_id } = req.params;

  pool.query("SELECT * FROM budgets WHERE budget_id = $1 AND user_id = $2", [budget_id, user_id])
    .then((budgetExists) => {
      if (budgetExists.rows.length === 0) {
        return res.status(404).json("Budget not found");
      }

      return pool.query("DELETE FROM expenses WHERE budget_id = $1", [budget_id]);
    })
    .then(() => {
      return pool.query("DELETE FROM budgets WHERE budget_id = $1", [budget_id]);
    })
    .then(() => {
      res.json({ message: "Budget and associated expenses deleted successfully" });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).send("Server Error");
    });
});

app.listen(5000, () => {
  console.log("server has started on port 5000");
});
