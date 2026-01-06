-- =====================================================
-- Finance Tracker Database Schema
-- Complete PostgreSQL schema for Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  month_start_day INTEGER NOT NULL DEFAULT 1 CHECK (month_start_day >= 1 AND month_start_day <= 28),
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'investment', 'wallet', 'other')),
  currency TEXT NOT NULL DEFAULT 'USD',
  starting_balance BIGINT NOT NULL DEFAULT 0, -- Stored in cents
  current_balance BIGINT NOT NULL DEFAULT 0,  -- Stored in cents
  color TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(user_id, type);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
  icon TEXT NOT NULL DEFAULT 'CircleDollarSign',
  color TEXT NOT NULL DEFAULT '#6366f1',
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(user_id, type);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount BIGINT NOT NULL CHECK (amount >= 0), -- Stored in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, -- For transfers
  merchant TEXT,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_rule_id UUID,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_account ON transactions(user_id, account_id);
CREATE INDEX idx_transactions_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_merchant ON transactions(user_id, merchant);

-- =====================================================
-- TRANSACTION TAGS (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX idx_transaction_tags_transaction ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag ON transaction_tags(tag_id);

-- =====================================================
-- TRANSACTION SPLITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount >= 0), -- Stored in cents
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_splits_transaction ON transaction_splits(transaction_id);

-- =====================================================
-- RECURRING RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  amount BIGINT NOT NULL CHECK (amount >= 0), -- Stored in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  merchant TEXT,
  notes TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  next_run_at DATE NOT NULL,
  last_run_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_next_run ON recurring_rules(next_run_at) WHERE is_active = TRUE;

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0), -- Stored in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- NULL = overall budget
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  rollover BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(user_id, category_id);

-- =====================================================
-- ASSETS TABLE (Investments)
-- =====================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf', 'mutual_fund', 'crypto', 'bond', 'commodity', 'real_estate', 'other')),
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange TEXT,
  sector TEXT,
  current_price BIGINT, -- Stored in cents
  price_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, asset_type)
);

CREATE INDEX idx_assets_symbol ON assets(symbol);
CREATE INDEX idx_assets_type ON assets(asset_type);

-- =====================================================
-- INVESTMENT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'fee', 'split', 'transfer_in', 'transfer_out')),
  quantity DECIMAL(20, 8) NOT NULL,
  price BIGINT NOT NULL, -- Price per unit in cents
  fees BIGINT NOT NULL DEFAULT 0, -- Stored in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_transactions_user ON investment_transactions(user_id);
CREATE INDEX idx_investment_transactions_account ON investment_transactions(account_id);
CREATE INDEX idx_investment_transactions_asset ON investment_transactions(asset_id);
CREATE INDEX idx_investment_transactions_date ON investment_transactions(user_id, date DESC);

-- =====================================================
-- HOLDINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
  average_cost BIGINT NOT NULL DEFAULT 0, -- Stored in cents
  total_cost BIGINT NOT NULL DEFAULT 0,   -- Stored in cents
  current_value BIGINT,                    -- Stored in cents
  unrealized_gain BIGINT,                  -- Stored in cents
  unrealized_gain_percent DECIMAL(10, 4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, account_id, asset_id)
);

CREATE INDEX idx_holdings_user ON holdings(user_id);
CREATE INDEX idx_holdings_account ON holdings(account_id);
CREATE INDEX idx_holdings_asset ON holdings(asset_id);

-- =====================================================
-- PORTFOLIO SNAPSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_value BIGINT NOT NULL,           -- Stored in cents
  total_cost BIGINT NOT NULL,            -- Stored in cents
  total_gain BIGINT NOT NULL,            -- Stored in cents
  total_gain_percent DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, date DESC);

-- =====================================================
-- GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'investment', 'debt_payoff', 'emergency_fund', 'other')),
  target_amount BIGINT NOT NULL CHECK (target_amount > 0), -- Stored in cents
  current_amount BIGINT NOT NULL DEFAULT 0,                 -- Stored in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  target_date DATE,
  icon TEXT,
  color TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user ON goals(user_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Assets table is public readable (shared price data)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Accounts policies
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Transaction tags policies (via transaction ownership)
CREATE POLICY "Users can manage transaction tags via transactions"
  ON transaction_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_tags.transaction_id
    AND t.user_id = auth.uid()
  ));

-- Transaction splits policies
CREATE POLICY "Users can manage splits via transactions"
  ON transaction_splits FOR ALL
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_splits.transaction_id
    AND t.user_id = auth.uid()
  ));

-- Recurring rules policies
CREATE POLICY "Users can view their own recurring rules"
  ON recurring_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring rules"
  ON recurring_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring rules"
  ON recurring_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring rules"
  ON recurring_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Assets policies (public read, admin write)
CREATE POLICY "Anyone can view assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

-- Investment transactions policies
CREATE POLICY "Users can view their own investment transactions"
  ON investment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment transactions"
  ON investment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment transactions"
  ON investment_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment transactions"
  ON investment_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view their own holdings"
  ON holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own holdings"
  ON holdings FOR ALL
  USING (auth.uid() = user_id);

-- Portfolio snapshots policies
CREATE POLICY "Users can view their own portfolio snapshots"
  ON portfolio_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio snapshots"
  ON portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_rules_updated_at
  BEFORE UPDATE ON recurring_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_transactions_updated_at
  BEFORE UPDATE ON investment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  amount_diff BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update source account
    IF NEW.type = 'expense' OR NEW.type = 'transfer' THEN
      UPDATE accounts SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.account_id;
    END IF;

    -- Update destination account for transfers
    IF NEW.type = 'transfer' AND NEW.to_account_id IS NOT NULL THEN
      UPDATE accounts SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.to_account_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.type = 'expense' OR OLD.type = 'transfer' THEN
      UPDATE accounts SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.account_id;
    END IF;

    IF OLD.type = 'transfer' AND OLD.to_account_id IS NOT NULL THEN
      UPDATE accounts SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.to_account_id;
    END IF;

    -- Apply new transaction
    IF NEW.type = 'expense' OR NEW.type = 'transfer' THEN
      UPDATE accounts SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.account_id;
    END IF;

    IF NEW.type = 'transfer' AND NEW.to_account_id IS NOT NULL THEN
      UPDATE accounts SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.to_account_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse deleted transaction
    IF OLD.type = 'expense' OR OLD.type = 'transfer' THEN
      UPDATE accounts SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.account_id;
    END IF;

    IF OLD.type = 'transfer' AND OLD.to_account_id IS NOT NULL THEN
      UPDATE accounts SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.to_account_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for transaction balance updates
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- =====================================================
-- DEFAULT DATA INSERTION FUNCTION
-- =====================================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Default expense categories
  INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
    (NEW.id, 'Food & Dining', 'expense', 'UtensilsCrossed', '#ef4444', true),
    (NEW.id, 'Transportation', 'expense', 'Car', '#f97316', true),
    (NEW.id, 'Shopping', 'expense', 'ShoppingBag', '#eab308', true),
    (NEW.id, 'Bills & Utilities', 'expense', 'Receipt', '#22c55e', true),
    (NEW.id, 'Entertainment', 'expense', 'Gamepad2', '#06b6d4', true),
    (NEW.id, 'Health & Fitness', 'expense', 'Heart', '#8b5cf6', true),
    (NEW.id, 'Travel', 'expense', 'Plane', '#ec4899', true),
    (NEW.id, 'Education', 'expense', 'GraduationCap', '#6366f1', true),
    (NEW.id, 'Personal Care', 'expense', 'Sparkles', '#14b8a6', true),
    (NEW.id, 'Other Expense', 'expense', 'MoreHorizontal', '#64748b', true),

    -- Default income categories
    (NEW.id, 'Salary', 'income', 'Briefcase', '#22c55e', true),
    (NEW.id, 'Freelance', 'income', 'Laptop', '#06b6d4', true),
    (NEW.id, 'Investments', 'income', 'TrendingUp', '#8b5cf6', true),
    (NEW.id, 'Gifts', 'income', 'Gift', '#ec4899', true),
    (NEW.id, 'Other Income', 'income', 'Plus', '#64748b', true);

  -- Default account
  INSERT INTO accounts (user_id, name, type, currency, icon, color)
  VALUES (NEW.id, 'Cash', 'cash', 'USD', 'Wallet', '#22c55e');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create defaults for new profiles
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();
