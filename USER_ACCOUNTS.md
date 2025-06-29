# Hostel Management System - User Accounts

## Updated Authentication System

The system now uses proper Supabase Authentication instead of hardcoded passwords. Below are the temporary passwords for initial setup.

**⚠️ IMPORTANT SECURITY NOTES:**
- These are temporary passwords for initial setup only
- Users should change their passwords on first login
- Remove this file from production systems
- Store passwords securely using a password manager

---

## Administrator Account

| Email | Name | Password | Role |
|-------|------|----------|------|
| admin@saratchandra.co.in | System Administrator | `SecureAdmin2024!` | Administrator |

---

## Campus Coordinators

| Email | Name | Password | Specialization |
|-------|------|----------|----------------|
| coord1@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Godavari & Sarayu Hostels Coordinator |
| coord2@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Ganga 1 & Ganga 2 Hostels Coordinator |
| coord3@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Krishna & Narmada Hostels Coordinator |
| coord4@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Brahmaputra 1 & Brahmaputra 2 Hostels Coordinator |
| coord5@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Saraswathi Hostel Coordinator |
| coord6@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Civils Lt Girls Hostel Coordinator |
| coord7@saratchandra.co.in | Campus Coordinator | `TempPass2024!` | Campus Coordinator |

---

## Floor Incharges

| Email | Name | Password | Hostel |
|-------|------|----------|--------|
| floor-incharge-godavari@saratchandra.co.in | Floor Incharge - Godavari | `TempPass2024!` | Godavari Hostel |
| floor-incharge-sarayu@saratchandra.co.in | Floor Incharge - Sarayu | `TempPass2024!` | Sarayu Hostel |
| floor-incharge-ganga1@saratchandra.co.in | Floor Incharge - Ganga 1 | `TempPass2024!` | Ganga 1 Hostel |
| floor-incharge-ganga2@saratchandra.co.in | Floor Incharge - Ganga 2 | `TempPass2024!` | Ganga 2 Hostel |
| floor-incharge-krishna@saratchandra.co.in | Floor Incharge - Krishna | `TempPass2024!` | Krishna Hostel |
| floor-incharge-brahmaputra1@saratchandra.co.in | Floor Incharge - Brahmaputra 1 | `TempPass2024!` | Brahmaputra 1 Hostel |
| floor-incharge-brahmaputra2@saratchandra.co.in | Floor Incharge - Brahmaputra 2 | `TempPass2024!` | Brahmaputra 2 Hostel |
| floor-incharge-narmada@saratchandra.co.in | Floor Incharge - Narmada | `TempPass2024!` | Narmada Hostel |
| floor-incharge-saraswathi@saratchandra.co.in | Floor Incharge - Saraswathi | `TempPass2024!` | Saraswathi Hostel |
| floor-incharge-civils-girls@saratchandra.co.in | Floor Incharge - Civils Girls | `TempPass2024!` | Civils Lt Girls Hostel |
| floor-incharge-benz-circle@saratchandra.co.in | Floor Incharge - Benz Circle | `TempPass2024!` | Benz Circle Hostel |

---

## Authentication Flow

1. **Current System**: Uses Supabase Auth with fallback to demo authentication
2. **Fallback Mode**: When Supabase Auth is not available, uses the temporary passwords above
3. **Production Ready**: Once Supabase Auth is fully configured, the system will use proper authentication

---

## Next Steps for Production

1. **Set up Supabase Auth users** for each account using the Supabase dashboard
2. **Force password change** on first login
3. **Remove demo passwords** from the code
4. **Delete this file** from the repository
5. **Enable email verification** for new accounts
6. **Set up password reset** functionality

---

## Password Requirements

For production passwords, enforce:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- No common dictionary words
- Regular password rotation policy

---

*Generated on: ${new Date().toISOString()}* 