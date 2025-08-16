# Contributing to Streamly

Thank you for your interest in contributing to Streamly! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)
- [Questions and Discussions](#questions-and-discussions)

## Getting Started

1. **Fork the Repository**
   - Click the "Fork" button on the [Streamly GitHub repository](https://github.com/oyingrace/streamly)
   - This creates your own copy of the project

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/streamly.git
   cd streamly
   ```

3. **Add the Original Repository as Upstream**
   ```bash
   git remote add upstream https://github.com/original-owner/streamly.git
   ```

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in the required environment variables in `.env.local`

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Verify Setup**
   - Open [http://localhost:3000](http://localhost:3000)
   - Ensure the application loads without errors

## Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/bug-description
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   - Ensure the app runs without errors
   - Test the specific functionality you modified
   - Check for any console errors

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new streaming feature"
   # or
   git commit -m "fix: resolve chat input issue"
   ```

## Pull Request Process

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Go to your fork on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template with:
     - Description of changes
     - Screenshots (if UI changes)
     - Testing steps
     - Any breaking changes

3. **Wait for Review**
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Update the PR as needed

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for new files
- Follow ESLint configuration
- Use meaningful variable and function names
- Add proper type annotations

### React Components
- Use functional components with hooks
- Follow the existing component structure
- Use proper prop types or TypeScript interfaces
- Keep components focused and reusable

### CSS/Styling
- Use Tailwind CSS classes
- Follow the existing design patterns
- Ensure responsive design
- Maintain accessibility standards

### File Organization
- Place components in `app/components/`
- Keep API routes in `app/api/`
- Use appropriate file naming conventions

## Testing

Before submitting a PR, please:

1. **Run the Development Server**
   ```bash
   npm run dev
   ```

2. **Test Core Functionality**
   - Room creation and joining
   - Streaming functionality
   - Chat features
   - UI responsiveness

3. **Check for Errors**
   - Browser console
   - Terminal output
   - Network requests

## Reporting Issues

When reporting issues, please include:

1. **Environment Information**
   - Operating system
   - Browser version
   - Node.js version

2. **Steps to Reproduce**
   - Clear, step-by-step instructions
   - Expected vs actual behavior

3. **Additional Context**
   - Screenshots or screen recordings
   - Console errors
   - Network tab information

## Questions and Discussions

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussions
- **Pull Requests**: For code reviews and technical discussions

## Mini App Compatibility

Since Streamly is designed for Mini App environments, please ensure:

- All changes maintain compatibility with Mini App constraints
- Test on target Mini App platforms
- Follow Mini App best practices
- Consider performance implications

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Getting Help

If you need help with your contribution:

1. Check existing issues and discussions
2. Ask questions in GitHub Discussions
3. Reach out to maintainers through issues

Thank you for contributing to Streamly! 🚀
