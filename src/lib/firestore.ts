import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import type { UserProfile, Goal, Transaction, FixedExpense } from './types';

const COLLECTIONS = {
  USERS: 'users',
  PROFILE: 'profile',
  GOALS: 'goals',
  TRANSACTIONS: 'transactions',
  FIXED_EXPENSES: 'fixed-expenses',
  LOGGED_PAYMENTS: 'logged-payments'
} as const;

function cleanData(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data.map(cleanData);
  if (typeof data === 'object') {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      const val = cleanData(data[key]);
      if (val !== undefined) {
        cleaned[key] = val;
      }
    });
    return cleaned;
  }
  return data;
}

export class FirestoreService {
  /**
   * Profile Methods
   */
  static async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      // Store profile under users/{userId}/profile/main
      await setDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILE, 'main'), cleanData(profile));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Getting profile for user:', userId);
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILE, 'main');
      console.log('Profile document path:', docRef.path);
      const docSnap = await getDoc(docRef);
      console.log('Profile exists:', docSnap.exists());
      return docSnap.exists() ? docSnap.data() as UserProfile : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  static async updateProfile(userId: string, updates: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILE, 'main');
      await setDoc(docRef, cleanData(updates));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Goals Methods
   */
  static async saveGoal(userId: string, goal: Goal): Promise<void> {
    try {
      await setDoc(
        doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS, goal.id),
        cleanData(goal)
      );
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  }

  static async getGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS);
      const q = query(goalsRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Goal);
    } catch (error) {
      console.error('Error getting goals:', error);
      throw error;
    }
  }

  static async deleteGoal(userId: string, goalId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS, goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  /**
   * Transactions Methods
   */
  static async saveTransaction(userId: string, transaction: Transaction): Promise<void> {
    try {
      await setDoc(
        doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS, transaction.id),
        cleanData(transaction)
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  static async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS);
      const q = query(transactionsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Transaction);
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  static async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS, transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Fixed Expenses Methods
   */
  static async saveFixedExpense(userId: string, expense: FixedExpense): Promise<void> {
    try {
      await setDoc(
        doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.FIXED_EXPENSES, expense.id),
        cleanData(expense)
      );
    } catch (error) {
      console.error('Error saving fixed expense:', error);
      throw error;
    }
  }

  static async getFixedExpenses(userId: string): Promise<FixedExpense[]> {
    try {
      const expensesRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.FIXED_EXPENSES);
      const q = query(expensesRef, orderBy('startDate', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as FixedExpense);
    } catch (error) {
      console.error('Error getting fixed expenses:', error);
      throw error;
    }
  }

  static async deleteFixedExpense(userId: string, expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.FIXED_EXPENSES, expenseId));
    } catch (error) {
      console.error('Error deleting fixed expense:', error);
      throw error;
    }
  }

  /**
   * Logged Payments Methods
   */
  static async saveLoggedPayments(userId: string, payments: any): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOGGED_PAYMENTS, 'main'), cleanData({ payments }));
    } catch (error) {
      console.error('Error saving logged payments:', error);
      throw error;
    }
  }

  static async getLoggedPayments(userId: string): Promise<any | null> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOGGED_PAYMENTS, 'main'));
      return docSnap.exists() ? docSnap.data().payments : null;
    } catch (error) {
      console.error('Error getting logged payments:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (used when deleting account)
   */
  static async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete profile
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILE, 'main'));

      // Delete all goals
      const goals = await this.getGoals(userId);
      await Promise.all(goals.map(goal =>
        deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.GOALS, goal.id))
      ));

      // Delete all transactions
      const transactions = await this.getTransactions(userId);
      await Promise.all(transactions.map(tx =>
        deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS, tx.id))
      ));

      // Delete all fixed expenses
      const expenses = await this.getFixedExpenses(userId);
      await Promise.all(expenses.map(expense =>
        deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.FIXED_EXPENSES, expense.id))
      ));

      // Delete logged payments
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.LOGGED_PAYMENTS, 'main'));

      // Finally, delete the user document itself
      await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}