# Career Vault Quick Reference

## 🚀 Most Common Patterns

### Pattern 1: Get User's Vault
```typescript
const { data: vault } = await supabase
  .from('career_vault')
  .select('*')
  .eq('user_id', userId)
  .single();

// ✅ Use: vault.id
// ❌ NOT: vault.vault_id
```

### Pattern 2: Query Intelligence Tables
```typescript
const { data: items } = await supabase
  .from('vault_power_phrases')
  .select('*')
  .eq('vault_id', vault.id)  // ← vault.id from career_vault!
  .order('created_at', { ascending: false });
```

### Pattern 3: Insert Intelligence Item
```typescript
const { error } = await supabase
  .from('vault_power_phrases')
  .insert({
    vault_id: vault.id,      // snake_case
    power_phrase: 'text',    // snake_case
    quality_tier: 'gold',    // snake_case
    confidence_score: 0.95   // snake_case
  });
```

## 🔑 Critical Rules

| Context | Use | NOT |
|---------|-----|-----|
| career_vault PK | `vault.id` | `vault.vault_id` ❌ |
| vault_* FK | `vault_id` | `id` ❌ |
| DB columns | `snake_case` | `camelCase` ❌ |
| TypeScript | `camelCase` | `snake_case` ❌ |

## 📦 Standard Response
```typescript
{
  success: true,
  data: {
    // Your payload here
  },
  metadata?: {
    timestamp: string
  }
}
```

## 🔍 Debugging Checklist
- [ ] Using `vault.id` not `vault.vault_id`?
- [ ] DB columns in `snake_case`?
- [ ] TypeScript variables in `camelCase`?
- [ ] Null checks on all queries?
- [ ] Response matches standard structure?

## 📚 Full Documentation
See [VAULT_NAMING_CONVENTIONS.md](./VAULT_NAMING_CONVENTIONS.md) for complete guide.
