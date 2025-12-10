<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumen Regnum - RPG Campaign Manager

An AI-powered RPG campaign management tool built with React, TypeScript, and Supabase.

View your app in AI Studio: https://ai.studio/apps/drive/1-3FnC4Jxbyt6RLKPhrC1WGIMt2L9ZuNf

## Features

- 📝 Campaign management and organization
- 🔐 Secure user authentication with Supabase
- 🎲 Character and session tracking
- 🤖 AI-powered content generation
- 🗑️ Secure account deletion

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   - Configure Supabase credentials (see [Supabase Setup](#supabase-setup))

3. Run the app:
   ```bash
   npm run dev
   ```

## Supabase Setup

This application uses Supabase for authentication and data storage.

### Initial Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Configure credentials in the app (stored in localStorage or via environment variables)

### Database Security Fix (Important!) ⚠️

A critical security vulnerability in the `delete_user` function has been identified and fixed. **You must apply the security migration** to your Supabase project:

1. Navigate to the `supabase/` directory
2. Follow the instructions in [`supabase/README.md`](./supabase/README.md)
3. Apply the migration file: `supabase/migrations/001_fix_delete_user_security.sql`

**What was fixed:**
- The `delete_user` function now has an explicit `search_path` setting
- Prevents SQL injection-like vulnerabilities
- Uses fully-qualified table names for security
- Implements proper authentication checks

For detailed setup instructions and troubleshooting, see the [Supabase README](./supabase/README.md).

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
├── components/        # Reusable React components
├── pages/            # Page components
├── services/         # API and service integrations
│   └── supabase.ts   # Supabase client and auth functions
├── supabase/         # Database migrations and functions
│   ├── migrations/   # SQL migration files
│   ├── functions/    # Database function definitions
│   └── README.md     # Supabase setup guide
├── types.ts          # TypeScript type definitions
└── App.tsx           # Main application component
```

## Security

- ✅ All database functions use explicit `search_path`
- ✅ Row Level Security (RLS) policies in Supabase
- ✅ Secure password reset flow
- ✅ SECURITY DEFINER functions properly scoped
- ✅ Input validation and sanitization

Please review the [supabase/README.md](./supabase/README.md) for security best practices and setup.

## Troubleshooting

### Tags System: "Não reconhece a tabela dmos_tags"
If you get an error when creating tags, see the comprehensive troubleshooting guide:
[docs/TROUBLESHOOTING_TAGS.md](./docs/TROUBLESHOOTING_TAGS.md)

Quick fix: Apply migrations from `supabase/migrations/` (see [supabase/migrations/README.md](./supabase/migrations/README.md))

### Password Recovery Not Working
See the "Password Recovery Setup" section in [supabase/README.md](./supabase/README.md)

### Delete User Function Failing
Apply the security migration in `supabase/migrations/001_fix_delete_user_security.sql`

### Build Warnings
The large bundle size warning is expected for the current setup. Consider code-splitting for production optimization.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all security best practices are followed
5. Submit a pull request

## License

This project is private and proprietary.
