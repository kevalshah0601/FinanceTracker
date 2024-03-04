import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import famIcon from '../Assets/familyImage.jpg';

export const Dashboard = () => {
  const { user_id } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newFamilyMember, setNewFamilyMember] = useState({
    memberName: '',
    memberEmail: '',
    memberPassword: '',
    relationship: '',
  });
  const [newBudget, setNewBudget] = useState({
    memberId: '',
    budget_name: '',
    budget_amount: '',
  });
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    budgetId: '',
    expenseName: '',
    expenseAmount: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user information
        const userResponse = await fetch(`http://localhost:5000/user/${user_id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
        }

        // Fetch family members
        const familyMembersResponse = await fetch(`http://localhost:5000/family-members/${user_id}`);
        if (familyMembersResponse.ok) {
          const membersData = await familyMembersResponse.json();
          setFamilyMembers(membersData);
        }
        
        const response = await fetch(`http://localhost:5000/expenses/${user_id}`);
        if (response.ok) {
          const expenseData = await response.json();
          setExpenses(expenseData);
        }

        // Fetch budgets for the user
        const budgetsResponse = await fetch(`http://localhost:5000/budgets/${user_id}`);
        if (budgetsResponse.ok) {
          const budgetsData = await budgetsResponse.json();
          setBudgets(budgetsData);
        }

        
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user_id]);

  const handleLogout = () => {
    navigate('/');
    console.log('Logout clicked');
  };

  const handleAddFamilyMember = async () => {
    try {
      const response = await fetch('http://localhost:5000/family-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_name: newFamilyMember.memberName,
          relationship: newFamilyMember.relationship,
          user_id: userInfo.user_id,
          member_password: newFamilyMember.memberPassword,
          member_email: newFamilyMember.memberEmail,
        }),
      });

      if (response.ok) {
        toast.success('Family member added successfully!');
        setNewFamilyMember({
          memberName: '',
          memberEmail: '',
          memberPassword: '',
          relationship: '',
        });

        const familyMembersResponse = await fetch(`http://localhost:5000/family-members/${user_id}`);
        if (familyMembersResponse.ok) {
          const membersData = await familyMembersResponse.json();
          setFamilyMembers(membersData);
        }
      } else {
        toast.error('Error adding family member');
        console.error('Error adding family member:', response.statusText);
      }
    } catch (error) {
      toast.error('Error adding family member');
      console.error('Error adding family member:', error);
    }
  };

  const handleAddBudget = async () => {
    try {
      // Check if memberId and budget_amount are not empty
      if(!newBudget.memberId && familyMembers.length===0){
        console.error("Came here for family member");
        setNewBudget({ ...newBudget, memberId: userInfo.user_id });
        // return;
      }else if (!newBudget.budget_amount.trim()) {
        console.error('Member ID or Budget Amount is empty');
        return;
      }else if(!newBudget.memberId && userInfo.ishead){
        console.error(userInfo.user_id);
        setNewBudget({ ...newBudget, memberId: userInfo.user_id });
      }
  
      const response = await fetch('http://localhost:5000/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: newBudget.memberId,
          budget_name: newBudget.budget_name,
          budget_amount: parseFloat(newBudget.budget_amount),
        }),
      });
  
      if (response.ok) {
        toast.success('Budget added successfully!');
        console.log('Budget added successfully!');
        setNewBudget({
          memberId: newBudget.memberId,
          budget_name: '',
          budget_amount: '',
        });
  
        // Fetch and update budgets after adding the new budget
        const budgetsResponse = await fetch(`http://localhost:5000/budgets/${user_id}`);
        if (budgetsResponse.ok) {
          const budgetsData = await budgetsResponse.json();
          setBudgets(budgetsData);
        }
      } else {
        console.error('Error adding budget:', response.status);
      }
    } catch (error) {
      console.error('Error during add budget:', error);
    }
  };  

  const handleAddExpense = async () => {
    try {
      if (!newExpense.budgetId || !newExpense.expenseAmount.trim()) {
        console.error('Budget ID or Expense Amount is empty');
        return;
      }

      const response = await fetch('http://localhost:5000/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          budget_id: newExpense.budgetId,
          expense_name: newExpense.expenseName,
          expense_amount: parseFloat(newExpense.expenseAmount),
        }),
      });

      if (response.ok) {
        toast.success('Expense added successfully!');
        console.log('Expense added successfully!');
        setNewExpense({
          budgetId: '',
          expenseName: '',
          expenseAmount: '',
        });

        const response = await fetch(`http://localhost:5000/expenses/${user_id}`);
        if (response.ok) {
          const expenseData = await response.json();
          setExpenses(expenseData);
        }

        const budgetsResponse = await fetch(`http://localhost:5000/budgets/${user_id}`);
        if (budgetsResponse.ok) {
          const budgetsData = await budgetsResponse.json();
          setBudgets(budgetsData);
        }
      } else {
        toast.error('Error adding expense');
        console.error('Error adding expense:', response.status);
      }
    } catch (error) {
      toast.error('Error adding expense');
      console.error('Error during add expense:', error);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      const response = await fetch(`http://localhost:5000/budgets/${user_id}/${budgetId}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        toast.success('Deleted successfully!');
        // Refresh the budgets after deleting
        const budgetsResponse = await fetch(`http://localhost:5000/budgets/${user_id}`);
        if (budgetsResponse.ok) {
          const budgetsData = await budgetsResponse.json();
          setBudgets(budgetsData);
        }
        const response = await fetch(`http://localhost:5000/expenses/${user_id}`);
        if (response.ok) {
          const expenseData = await response.json();
          setExpenses(expenseData);
        }
      } else {
        toast.error('Error in Deleting')
        console.error('Error deleting budget:', response.status);
      }
    } catch (error) {
      toast.error('Error in Deleting')
      console.error('Error during delete budget:', error);
    }
  };
  
  const confirmDeleteBudget = (budgetId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this budget?');
  
    if (confirmDelete) {
      handleDeleteBudget(budgetId);
    }
  };

  // Add this function to handle expense deletion
  const handleDeleteExpense = async (expenseId, budgetId, expenseAmount) => {
    try {
      const shouldDelete = window.confirm('Are you sure you want to delete this expense?');
      
      if (!shouldDelete) {
        return; // If the user cancels the delete action, do nothing
      }
    
      const response = await fetch(`http://localhost:5000/expenses/${user_id}/${expenseId}`, {
        method: 'DELETE',
      });
    
      if (response.ok) {
        console.log('Expense deleted successfully!');
        console.log('Remaining budget updated successfully!');
        toast.success('Deleted successfully!');
        // Fetch and update expenses after deleting the expense
        const expensesResponse = await fetch(`http://localhost:5000/expenses/${user_id}`);
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData);
        }
        // Refresh the budgets after deleting
        const budgetsResponse = await fetch(`http://localhost:5000/budgets/${user_id}`);
        if (budgetsResponse.ok) {
          const budgetsData = await budgetsResponse.json();
          setBudgets(budgetsData);
        }
      } else {
        console.error('Error deleting expense:', response.status);
      }
    } catch (error) {
      console.error('Error during expense deletion:', error);
    }
  };

  
  return (
    <div className="dashboard-container">
      <div className="logout-button-container">
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
      <h1 className="dashboard-title">Welcome to the Dashboard</h1>
      {userInfo && <p className="greeting-message">Hello, {userInfo.name}!</p>}

      {/* Conditional rendering based on userInfo.isHead */}
      {userInfo && userInfo.ishead && (
        <div className='first-row'>
          <div className="form-container">
            <h2>Add Family Member</h2>
            <div className="form-row">
              <label>Member Name:</label>
              <input
                type="text"
                value={newFamilyMember.memberName}
                onChange={(e) =>
                  setNewFamilyMember((prev) => ({ ...prev, memberName: e.target.value }))
                }
              />
            </div>
            <div className="form-row">
              <label>Member Email:</label>
              <input
                type="email"
                value={newFamilyMember.memberEmail}
                onChange={(e) =>
                  setNewFamilyMember((prev) => ({ ...prev, memberEmail: e.target.value }))
                }
              />
            </div>
              
            <div className="form-row">
              <label>Member Password:</label>
              <input
                type="password"
                value={newFamilyMember.memberPassword}
                onChange={(e) =>
                  setNewFamilyMember((prev) => ({ ...prev, memberPassword: e.target.value }))
                }
              />
            </div>
            <div className="form-row">
              <label>Relationship:</label>
              <input
                type="text"
                value={newFamilyMember.relationship}
                onChange={(e) =>
                  setNewFamilyMember((prev) => ({ ...prev, relationship: e.target.value }))
                }
              />
            </div>
            <button onClick={handleAddFamilyMember} className="action-button">Add Family Member</button>
          </div>
          <div className="image-container">
            <img
              src={famIcon}
              alt="Family"
              className="family-image"
            />
          </div>
        </div>
      )}

      {/* Add Budget Section */}

      {userInfo && (
        <div className='forms-container'>
          <div className="form-container">
            <h2>Add Budget</h2>
            <div className="form-row">
              <label>Family Member:</label>
              {userInfo.ishead ? 
                <select
                  value={newBudget.memberId}
                  onChange={(e) => setNewBudget({ ...newBudget, memberId: e.target.value })}
                >
                  <option value={userInfo.user_id}>{userInfo.name} (Self)</option>
                  {familyMembers.map((member) => (
                    <option key={member.member_id} value={member.member_id}>
                      {member.member_name}
                    </option>
                  ))}
                </select> : 
                 <div className='notHead'>{userInfo.name}</div>
              }
            </div>
            <div className="form-row">
              <label>Budget Name:</label>
              <input
                type="text"
                value={newBudget.budget_name}
                onChange={(e) => setNewBudget({ ...newBudget, budget_name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Budget Amount:</label>
              <input
                type="number"
                value={newBudget.budget_amount}
                onChange={(e) => setNewBudget({ ...newBudget, budget_amount: e.target.value })}
              />
            </div>
            <button onClick={handleAddBudget} className="action-button">Add Budget</button>
          </div>

          <div className="form-container">
            <h2>Add Expense</h2>
            <div className="form-row">
              <label>Budget:</label>
              <select
                value={newExpense.budgetId}
                onChange={(e) => setNewExpense({ ...newExpense, budgetId: e.target.value })}
              >
                <option value="">Select Budget</option>
                {budgets.map((budget) => (
                  <option key={budget.budget_id} value={budget.budget_id}>
                    {budget.budget_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Expense Name:</label>
              <input
                type="text"
                value={newExpense.expenseName}
                onChange={(e) => setNewExpense({ ...newExpense, expenseName: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Expense Amount:</label>
              <input
                type="number"
                value={newExpense.expenseAmount}
                onChange={(e) => setNewExpense({ ...newExpense, expenseAmount: e.target.value })}
              />
            </div>
            <button onClick={handleAddExpense} className="action-button">Add Expense</button>
          </div>
        </div>
      )}

      

      {budgets.length > 0 && (
        <div className="budget-overview-container">
          <h2>Budget Overview</h2>
          <table className="budget-table">
            <thead>
              <tr>
                <th>Budget Name</th>
                <th>Budget Amount</th>
                <th>Spent Amount</th>
                <th>Remaining Budget</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => (
                <tr key={budget.budget_id}>
                  <td>{budget.budget_name}</td>
                  <td>{budget.budget_amount}</td>
                  {/* Calculate spent amount based on expenses */}
                  <td>{budget.budget_amount - budget.budget_remaining}</td>
                  <td>{budget.budget_remaining}</td>
                  <td>
                    <button onClick={() => confirmDeleteBudget(budget.budget_id)} className="delete-button">
                    Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="expenses-container">
          <h2>Expense Details</h2>
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Expense Name</th>
                <th>Budget Name</th>
                <th>Expense Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.expense_id}>
                  <td>{expense.expense_name}</td>
                  <td>{expense.budget_name}</td>
                  <td>{expense.expense_amount}</td>
                  <td>
                    <button onClick={() => handleDeleteExpense(expense.expense_id, expense.budget_id, expense.expense_amount)} className='delete-button'>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};
