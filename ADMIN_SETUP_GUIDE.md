# 🛡️ Admin Setup Guide

## How to Create an Admin User

Since no admin users currently exist in your database, you need to create one. Here are two methods:

### Method 1: Using Lovable Cloud Dashboard (Recommended)

1. **Open Lovable Cloud Dashboard**
   - Click the "Cloud" button in the top right of Lovable
   - Navigate to **Database** → **Tables**

2. **Create a Student Account First**
   - Go to `/student-auth` in your app
   - Sign up with email and password
   - This automatically creates a user in `auth.users` and `profiles` tables

3. **Assign Admin Role**
   - In Lovable Cloud Dashboard, go to **user_roles** table
   - Find your newly created user
   - Change the `role` from `student` to `admin`
   - OR manually insert a new row:
     ```
     user_id: [your-user-id-from-auth.users]
     role: admin
     ```

### Method 2: Using SQL Query (Advanced)

If you have access to the database directly:

```sql
-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Update role to admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = '[your-user-id-from-step-1]';

-- OR if no role exists, insert one:
INSERT INTO user_roles (user_id, role)
VALUES ('[your-user-id]', 'admin');
```

### Method 3: Quick Test Account

For testing purposes, you can:

1. **Sign up as student** at `/student-auth`
2. **Get your user ID** from the browser console:
   ```javascript
   // Open browser console (F12)
   const { data } = await supabase.auth.getUser();
   console.log('My User ID:', data.user.id);
   ```
3. **Use Cloud Dashboard** to change role to admin

---

## How to Login as Admin

Once you have an admin user created:

1. **Navigate to Admin Login Page**
   - Go to `/admin-auth` or click "Admin Login" from the homepage
   - **NOT** `/student-auth` (that's for students only)

2. **Enter Credentials**
   - Use the same email/password you created
   - The system validates your role server-side

3. **Automatic Redirect**
   - After successful login, you'll be redirected to `/dashboard`
   - The system detects your admin role and shows the Admin Dashboard

---

## Troubleshooting

### "Failed to load data" Error
✅ **Fixed**: Updated query logic to properly fetch complaints and profiles

### "Not authorized" Error
- Verify your user has `role = 'admin'` in `user_roles` table
- Check RLS policies allow admin access
- Try logging out and back in

### Can't see complaints
- Check that complaints exist in the database
- Verify RLS policies are correct
- Check browser console for errors

### Admin Dashboard shows no data
- Verify complaints exist: `SELECT COUNT(*) FROM complaints;`
- Check your role: `SELECT role FROM user_roles WHERE user_id = auth.uid();`
- Clear browser cache and reload

---

## Admin vs Student Differences

| Feature | Student | Admin |
|---------|---------|-------|
| Login Page | `/student-auth` | `/admin-auth` |
| Can create complaints | ✅ Yes | ❌ No |
| Can view all complaints | ❌ No (only own) | ✅ Yes (all) |
| Can change status | ❌ No | ✅ Yes |
| Can assign complaints | ❌ No | ✅ Yes |
| Analytics dashboard | ❌ No | ✅ Yes |
| Security logs | ❌ No | ✅ Yes |
| Suspicious activities | ❌ No | ✅ Yes |

---

## Quick Admin Creation Script

Run this in Lovable Cloud → Database → SQL Editor:

```sql
-- Replace 'admin@example.com' and 'your-secure-password' with your values

-- This assumes you've already created a student account
-- Just need to upgrade it to admin

UPDATE user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
```

---

## Testing Your Admin Access

After creating admin user:

1. ✅ Login at `/admin-auth`
2. ✅ Check you see "Brototype Resolve Admin" in header
3. ✅ Verify you see all complaints (not just yours)
4. ✅ Check analytics dashboard shows charts
5. ✅ Verify security logs are visible
6. ✅ Try updating a complaint status

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Limit Admin Accounts**: Only create admin accounts for authorized personnel
2. **Strong Passwords**: Use complex passwords for admin accounts
3. **Monitor Admin Activity**: Check audit logs regularly
4. **Role Verification**: Server-side role validation is enforced via Edge Functions
5. **RLS Policies**: All admin actions are protected by Row-Level Security

---

## Need Help?

If you're still having issues:

1. Check browser console for errors (F12)
2. Verify your role in the database
3. Check that RLS policies are enabled
4. Review security logs for failed auth attempts
5. Contact support with error details

---

**Last Updated**: 2025-11-21  
**Version**: 1.0.0
