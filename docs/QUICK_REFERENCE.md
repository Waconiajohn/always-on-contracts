# Master Resume Quick Reference

> **Note:** Database tables retain `career_vault` and `vault_*` naming for backward compatibility.
> The product is called "Master Resume" but the underlying tables are unchanged.

## 🚀 Most Common Patterns

### Pattern 1: Get User's Master Resume
```typescript
// Table is still named 'career_vault' in the database
const { data: resume } = await supabase
  .from('career_vault')
  .select('*')
  .eq('user_id', userId)
  .single();

// ✅ Use: resume.id
// ❌ NOT: resume.vault_id
```

### Pattern 2: Query Intelligence Tables
```typescript
// Tables retain 'vault_*' prefix in database
const { data: items } = await supabase
  .from('vault_power_phrases')
  .select('*')
  .eq('vault_id', resume.id)  // ← resume.id from career_vault!
  .order('created_at', { ascending: false });
```

### Pattern 3: Insert Intelligence Item
```typescript
const { error } = await supabase
  .from('vault_power_phrases')
  .insert({
    vault_id: resume.id,      // snake_case
    power_phrase: 'text',    // snake_case
    quality_tier: 'gold',    // snake_case
    confidence_score: 0.95   // snake_case
  });
```

## 🔑 Critical Rules

| Context | Use | NOT |
|---------|-----|-----|
| career_vault PK | `resume.id` | `resume.vault_id` ❌ |
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
- [ ] Using `resume.id` not `resume.vault_id`?
- [ ] DB columns in `snake_case`?
- [ ] TypeScript variables in `camelCase`?
- [ ] Null checks on all queries?
- [ ] Response matches standard structure?

## 📚 Full Documentation
See [MASTER_RESUME_NAMING_CONVENTIONS.md](./MASTER_RESUME_NAMING_CONVENTIONS.md) for complete guide.
