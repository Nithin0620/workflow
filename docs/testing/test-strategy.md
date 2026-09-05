# Testing Strategy & Test Suites 🧪

Workflow adopts a multi-tiered testing strategy to ensure reliability, regression prevention, and confidence across all layers of the application.

---

## 🎯 Test Levels & Pyramid

```
                ▲
               / \
              /   \
             / E2E \       Playwright browser journeys
            /-------\
           / Integr. \     End-to-end data lifecycles & actions
          /-----------\
         / Smoke/Sanity\   Core exports & UI component rendering
        /---------------\
       /      Unit       \ Validators, hashing, formatters, utilities
      /-------------------\
```

---

## 📁 Test Directory Breakdown

```
tests/
├── unit/                        # Fast, deterministic isolated tests
│   ├── utils.test.ts            # Formatting, slugification, cn()
│   ├── validators.test.ts       # Zod schemas for all mutations
│   ├── password.test.ts         # Bcrypt hashing & verification
│   └── constants.test.ts        # Enumerations, statuses & roles
├── sanity/                      # Configuration & export sanity
│   └── core-exports.test.ts     # Prisma singleton & NextAuth options
├── smoke/                       # Component & route smoke checks
│   ├── components.test.tsx      # Button, Badge, Card, IssueCard rendering
│   └── auth-routes.test.ts      # Provider callbacks & session strategy
├── integration/                 # Multi-step business workflows
│   └── workflow-hierarchy.test.ts # User ➔ Org ➔ Workspace ➔ Project ➔ Issue ➔ Move
├── regression/                  # Boundary conditions & edge cases
│   └── edge-cases.test.ts       # Slug collisions, bounds, story points
├── e2e/                         # Browser end-to-end specs
│   └── auth-and-kanban.spec.ts  # Playwright user journeys
└── setup.ts                     # Jest-DOM matchers and mock setup
```

---

## 🚀 Running Tests

```bash
# Run all Unit, Sanity, Smoke, Integration & Regression tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:smoke

# Run E2E Playwright tests
pnpm test:e2e
```
