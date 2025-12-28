# FishCards

An intelligent flashcard learning platform that leverages AI to accelerate the creation and management of educational flashcards, making spaced repetition learning more accessible and efficient.

## Project Description

FishCards addresses the time-consuming challenge of manually creating high-quality flashcards for spaced repetition learning. By integrating Large Language Models (LLMs) via API, the platform enables users to quickly generate flashcard suggestions from any text input (such as textbook excerpts), dramatically reducing the effort required to build comprehensive study materials.

The application provides a complete flashcard management ecosystem including AI-powered generation, manual creation, editing capabilities, and learning sessions powered by proven spaced repetition algorithms.

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web applications with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing for better IDE support and code quality
- **Tailwind CSS 4** - Utility-first CSS framework for rapid styling
- **Shadcn/ui** - Accessible React component library for consistent UI

### Backend
- **Supabase** - Complete backend-as-a-service solution providing:
  - PostgreSQL database
  - Multi-language SDKs
  - Built-in user authentication
  - Open source, self-hostable

### AI Integration
- **OpenRouter.ai** - Access to multiple LLM providers (OpenAI, Anthropic, Google, etc.) with:
  - Cost-effective model selection
  - Financial limits on API keys

### CI/CD & Hosting
- **GitHub Actions** - Automated CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker containers

## Getting Started Locally

### Prerequisites
- Node.js 22.14.0 (use nvm or similar version manager)
- Bun package manager (recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd FishCards
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start the development server |
| `bun run build` | Build the project for production |
| `bun run preview` | Preview the production build locally |
| `bun run astro` | Run Astro CLI commands |
| `bun run lint` | Run ESLint to check code quality |
| `bun run lint:fix` | Automatically fix ESLint issues |
| `bun run format` | Format code using Prettier |
| `bun run check-mvp` | Run MVP validation checks |

## Project Scope

### MVP Features
- **User Authentication**: Registration and login system
- **AI Flashcard Generation**: Generate flashcards from text input (1000-10000 characters)
- **Manual Flashcard Creation**: Create custom flashcards with front/back content
- **Flashcard Management**: Edit and delete existing flashcards
- **Learning Sessions**: Spaced repetition algorithm integration
- **Data Privacy**: GDPR-compliant user data storage and management
- **Statistics**: Track AI-generated vs. accepted flashcards

### Out of Scope (Future Enhancements)
- Mobile applications (web-only for MVP)
- Gamification features
- Flashcard sharing between users
- Custom spaced repetition algorithms
- Advanced search functionality
- Public API
- Document import (PDF, DOCX, etc.)
- Advanced notifications

## Project Status

🚧 **MVP in Development**

The project is currently in active development of the Minimum Viable Product (MVP). Core features are being implemented and tested. Key success metrics target 75% acceptance rate for AI-generated flashcards and 75% of new flashcards being created via AI assistance.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
