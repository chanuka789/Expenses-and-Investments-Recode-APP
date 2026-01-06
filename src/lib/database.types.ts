export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          base_currency: string
          month_start_day: number
          date_format: string
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          base_currency?: string
          month_start_day?: number
          date_format?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          base_currency?: string
          month_start_day?: number
          date_format?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'investment' | 'wallet' | 'other'
          currency: string
          starting_balance: number
          current_balance: number
          color: string | null
          icon: string | null
          is_active: boolean
          include_in_total: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'credit_card' | 'investment' | 'wallet' | 'other'
          currency?: string
          starting_balance?: number
          current_balance?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
          include_in_total?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'cash' | 'bank' | 'credit_card' | 'investment' | 'wallet' | 'other'
          currency?: string
          starting_balance?: number
          current_balance?: number
          color?: string | null
          icon?: string | null
          is_active?: boolean
          include_in_total?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'expense' | 'income' | 'both'
          icon: string
          color: string
          parent_id: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'expense' | 'income' | 'both'
          icon?: string
          color?: string
          parent_id?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'expense' | 'income' | 'both'
          icon?: string
          color?: string
          parent_id?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          currency: string
          date: string
          category_id: string | null
          account_id: string
          to_account_id: string | null
          merchant: string | null
          notes: string | null
          is_recurring: boolean
          recurring_rule_id: string | null
          attachment_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expense' | 'income' | 'transfer'
          amount: number
          currency?: string
          date: string
          category_id?: string | null
          account_id: string
          to_account_id?: string | null
          merchant?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_rule_id?: string | null
          attachment_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'expense' | 'income' | 'transfer'
          amount?: number
          currency?: string
          date?: string
          category_id?: string | null
          account_id?: string
          to_account_id?: string | null
          merchant?: string | null
          notes?: string | null
          is_recurring?: boolean
          recurring_rule_id?: string | null
          attachment_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transaction_tags: {
        Row: {
          transaction_id: string
          tag_id: string
        }
        Insert: {
          transaction_id: string
          tag_id: string
        }
        Update: {
          transaction_id?: string
          tag_id?: string
        }
      }
      transaction_splits: {
        Row: {
          id: string
          transaction_id: string
          category_id: string
          amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          category_id: string
          amount: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          category_id?: string
          amount?: number
          notes?: string | null
          created_at?: string
        }
      }
      recurring_rules: {
        Row: {
          id: string
          user_id: string
          name: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          amount: number
          currency: string
          type: 'expense' | 'income'
          category_id: string | null
          account_id: string
          merchant: string | null
          notes: string | null
          start_date: string
          end_date: string | null
          next_run_at: string
          last_run_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          amount: number
          currency?: string
          type: 'expense' | 'income'
          category_id?: string | null
          account_id: string
          merchant?: string | null
          notes?: string | null
          start_date: string
          end_date?: string | null
          next_run_at: string
          last_run_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
          amount?: number
          currency?: string
          type?: 'expense' | 'income'
          category_id?: string | null
          account_id?: string
          merchant?: string | null
          notes?: string | null
          start_date?: string
          end_date?: string | null
          next_run_at?: string
          last_run_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          currency: string
          category_id: string | null
          period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string | null
          rollover: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          currency?: string
          category_id?: string | null
          period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date?: string | null
          rollover?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          currency?: string
          category_id?: string | null
          period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date?: string
          end_date?: string | null
          rollover?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          symbol: string
          name: string
          asset_type: 'stock' | 'etf' | 'mutual_fund' | 'crypto' | 'bond' | 'commodity' | 'real_estate' | 'other'
          currency: string
          exchange: string | null
          sector: string | null
          current_price: number | null
          price_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          asset_type: 'stock' | 'etf' | 'mutual_fund' | 'crypto' | 'bond' | 'commodity' | 'real_estate' | 'other'
          currency?: string
          exchange?: string | null
          sector?: string | null
          current_price?: number | null
          price_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          asset_type?: 'stock' | 'etf' | 'mutual_fund' | 'crypto' | 'bond' | 'commodity' | 'real_estate' | 'other'
          currency?: string
          exchange?: string | null
          sector?: string | null
          current_price?: number | null
          price_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investment_transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          asset_id: string
          type: 'buy' | 'sell' | 'dividend' | 'fee' | 'split' | 'transfer_in' | 'transfer_out'
          quantity: number
          price: number
          fees: number
          currency: string
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          asset_id: string
          type: 'buy' | 'sell' | 'dividend' | 'fee' | 'split' | 'transfer_in' | 'transfer_out'
          quantity: number
          price: number
          fees?: number
          currency?: string
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          asset_id?: string
          type?: 'buy' | 'sell' | 'dividend' | 'fee' | 'split' | 'transfer_in' | 'transfer_out'
          quantity?: number
          price?: number
          fees?: number
          currency?: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      holdings: {
        Row: {
          id: string
          user_id: string
          account_id: string
          asset_id: string
          quantity: number
          average_cost: number
          total_cost: number
          current_value: number | null
          unrealized_gain: number | null
          unrealized_gain_percent: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          asset_id: string
          quantity: number
          average_cost: number
          total_cost: number
          current_value?: number | null
          unrealized_gain?: number | null
          unrealized_gain_percent?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          asset_id?: string
          quantity?: number
          average_cost?: number
          total_cost?: number
          current_value?: number | null
          unrealized_gain?: number | null
          unrealized_gain_percent?: number | null
          updated_at?: string
        }
      }
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string
          date: string
          total_value: number
          total_cost: number
          total_gain: number
          total_gain_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          total_value: number
          total_cost: number
          total_gain: number
          total_gain_percent: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          total_value?: number
          total_cost?: number
          total_gain?: number
          total_gain_percent?: number
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'savings' | 'investment' | 'debt_payoff' | 'emergency_fund' | 'other'
          target_amount: number
          current_amount: number
          currency: string
          target_date: string | null
          icon: string | null
          color: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'savings' | 'investment' | 'debt_payoff' | 'emergency_fund' | 'other'
          target_amount: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          icon?: string | null
          color?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'savings' | 'investment' | 'debt_payoff' | 'emergency_fund' | 'other'
          target_amount?: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          icon?: string | null
          color?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type Account = Tables<'accounts'>
export type Category = Tables<'categories'>
export type Tag = Tables<'tags'>
export type Transaction = Tables<'transactions'>
export type TransactionSplit = Tables<'transaction_splits'>
export type RecurringRule = Tables<'recurring_rules'>
export type Budget = Tables<'budgets'>
export type Asset = Tables<'assets'>
export type InvestmentTransaction = Tables<'investment_transactions'>
export type Holding = Tables<'holdings'>
export type PortfolioSnapshot = Tables<'portfolio_snapshots'>
export type Goal = Tables<'goals'>

// Extended types with relations
export type TransactionWithRelations = Transaction & {
  category?: Category | null
  account?: Account
  tags?: Tag[]
  splits?: TransactionSplit[]
}

export type HoldingWithAsset = Holding & {
  asset: Asset
  account: Account
}

export type BudgetWithCategory = Budget & {
  category?: Category | null
  spent?: number
  remaining?: number
  percentage?: number
}
