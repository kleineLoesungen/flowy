# Flowy

A workflow management system for creating, managing, and tracking flow instances based on customizable templates with team assignments and visual workflow representation.

## Key Features

- **Visual Workflow Builder**: Create and visualize workflow templates using an intuitive node-based editor
- **Template Management**: Design reusable workflow templates with customizable steps and dependencies
- **Flow Instances**: Generate workflow instances from templates and track their progress
- **Team Assignment**: Assign workflows and individual steps to specific teams
- **User Management**: Comprehensive user and team administration
- **Email Notifications**: Automated email notifications for workflow updates and assignments
- **Audit Logging**: Track all system activities and changes
- **PostgreSQL Database**: Robust data persistence with Drizzle ORM
- **Responsive UI**: Modern Vue 3 interface with Tailwind CSS

## Email Notifications

Users receive email notifications in the following cases:

- **Status Changes**: When an element's status changes (sent to owner and consulted teams, excluding the user who made the change)
- **New Comments**: When a comment is added to an element
  - For **artefacts**: All flow participants are notified (everyone assigned to any element in the flow)
  - For **actions/states**: Owner and consulted team members are notified
  - Excludes the commenter
- **Overdue Elements**: When an element passes its expected end date without being completed or aborted (sent to owner team)
- **Daily Overdue Summary**: Consolidated report of all overdue elements sent at 9:00 AM daily (sent to team members with overdue items)
- **New Flow Creation**: When a new workflow instance is created (sent to all users, excluding the creator)

*Note: Email notifications require SMTP configuration. If SMTP is not configured, notifications are silently disabled.*

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 (if running without Docker)
- Docker and Docker Compose (if running with Docker)

### Option 1: Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flowy
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database and SMTP settings:
   ```env
   NUXT_DB_HOST=db
   NUXT_DB_PORT=5432
   NUXT_DB_NAME=flowy
   NUXT_DB_USER=postgres
   NUXT_DB_PASS=your_password
   NUXT_DB_SCHEMA=public
   
   NUXT_SMTP_HOST=smtp.example.com
   NUXT_SMTP_PORT=587
   NUXT_SMTP_USER=your_smtp_user
   NUXT_SMTP_PASS=your_smtp_password
   NUXT_SMTP_FROM=noreply@example.com
   
   NUXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Start a PostgreSQL database container
   - Build and start the Flowy application container
   - The app will be available at `http://localhost:3000`

4. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Running without Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flowy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   
   Create a PostgreSQL database and note the connection details.

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   NUXT_DB_HOST=localhost
   NUXT_DB_PORT=5432
   NUXT_DB_NAME=flowy
   NUXT_DB_USER=postgres
   NUXT_DB_PASS=your_password
   NUXT_DB_SCHEMA=public
   
   NUXT_SMTP_HOST=smtp.example.com
   NUXT_SMTP_PORT=587
   NUXT_SMTP_USER=your_smtp_user
   NUXT_SMTP_PASS=your_smtp_password
   NUXT_SMTP_FROM=noreply@example.com
   
   NUXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

7. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Development

### Running Tests
```bash
npm test
```

### Project Structure

- `app/` - Frontend Vue components, pages, and composables
- `server/` - Backend API endpoints, database, and utilities
- `tests/` - Unit and integration tests
- `utils/` - Shared utility functions
- `public/` - Static assets
- `data/logs.json` - Changelog of user changes

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, Tailwind CSS, Vue Flow
- **Backend**: Nitro (Nuxt server), Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt
- **Email**: Nodemailer
- **Testing**: Vitest

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

**You are free to:**
- Use the software for any purpose
- Change the software to suit your needs
- Share the software with others
- Share the changes you make

**Under the following conditions:**
- Any modified or derivative work must also be open source
- Any modified or derivative work must be licensed under GPL-3.0
- The software must remain free for everyone
- You must include the original copyright and license notices

For the full license text, see the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).
