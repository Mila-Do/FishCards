#!/usr/bin/env node

/**
 * MVP Status Checker for Astro Project
 * Analyzes project readiness for MVP deployment
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

class MVPChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      overall: { score: 0, total: 100, status: "unknown" },
      categories: {},
    };
  }

  async run() {
    console.log("🔍 Analyzing MVP Status...\n");

    // Project Structure
    await this.checkProjectStructure();

    // Dependencies
    await this.checkDependencies();

    // Build Status
    await this.checkBuildStatus();

    // Code Quality
    await this.checkCodeQuality();

    // Functionality
    await this.checkFunctionality();

    // Performance
    await this.checkPerformance();

    // Security
    await this.checkSecurity();

    // Calculate Overall Score
    this.calculateOverallScore();

    // Generate Report
    this.generateReport();

    return this.results;
  }

  async checkProjectStructure() {
    console.log("📁 Checking Project Structure...");

    const structure = {
      name: "Project Structure",
      score: 0,
      total: 20,
      checks: [],
      status: "unknown",
    };

    const requiredDirs = ["src", "src/pages", "src/components", "src/layouts", "public", "src/lib", "src/styles"];

    const optionalDirs = ["src/db", "src/types.ts", "src/middleware", "src/pages/api", "src/components/ui"];

    // Check required directories
    for (const dir of requiredDirs) {
      const exists = fs.existsSync(path.join(this.projectRoot, dir));
      structure.checks.push({
        name: `Required: ${dir}`,
        status: exists ? "pass" : "fail",
        message: exists ? "✓ Exists" : "✗ Missing",
      });
      if (exists) structure.score += 3;
    }

    // Check optional directories
    for (const dir of optionalDirs) {
      const exists = fs.existsSync(path.join(this.projectRoot, dir));
      structure.checks.push({
        name: `Optional: ${dir}`,
        status: exists ? "pass" : "warning",
        message: exists ? "✓ Exists" : "⚠ Not implemented yet",
      });
      if (exists) structure.score += 1;
    }

    // Check configuration files
    const configFiles = ["package.json", "astro.config.mjs", "tsconfig.json", "tailwind.config.js", "eslint.config.js"];

    for (const file of configFiles) {
      const exists = fs.existsSync(path.join(this.projectRoot, file));
      structure.checks.push({
        name: `Config: ${file}`,
        status: exists ? "pass" : "fail",
        message: exists ? "✓ Exists" : "✗ Missing",
      });
      if (exists) structure.score += 1;
    }

    structure.status = structure.score >= 15 ? "good" : structure.score >= 10 ? "warning" : "fail";
    this.results.categories.structure = structure;
  }

  async checkDependencies() {
    console.log("📦 Checking Dependencies...");

    const deps = {
      name: "Dependencies",
      score: 0,
      total: 15,
      checks: [],
      status: "unknown",
    };

    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

      // Core dependencies
      const coreDeps = ["astro", "@astrojs/react", "react", "react-dom", "tailwindcss", "typescript"];

      for (const dep of coreDeps) {
        const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
        const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
        const exists = inDeps || inDevDeps;

        deps.checks.push({
          name: `Core: ${dep}`,
          status: exists ? "pass" : "fail",
          message: exists ? "✓ Installed" : "✗ Missing",
        });
        if (exists) deps.score += 1;
      }

      // Check for security issues
      try {
        execSync("npm audit --audit-level=moderate", { stdio: "pipe" });
        deps.checks.push({
          name: "Security Audit",
          status: "pass",
          message: "✓ No security issues found",
        });
        deps.score += 3;
      } catch (error) {
        deps.checks.push({
          name: "Security Audit",
          status: "warning",
          message: "⚠ Security issues detected",
        });
        deps.score += 1;
      }

      // Check for outdated packages
      try {
        const outdated = execSync("npm outdated --json", { stdio: "pipe", encoding: "utf8" });
        const outdatedCount = Object.keys(JSON.parse(outdated || "{}")).length;
        deps.checks.push({
          name: "Package Updates",
          status: outdatedCount === 0 ? "pass" : "warning",
          message: outdatedCount === 0 ? "✓ All packages up to date" : `⚠ ${outdatedCount} packages outdated`,
        });
        deps.score += outdatedCount === 0 ? 2 : 1;
      } catch (error) {
        deps.checks.push({
          name: "Package Updates",
          status: "warning",
          message: "⚠ Could not check updates",
        });
        deps.score += 1;
      }
    } catch (error) {
      deps.checks.push({
        name: "Package.json",
        status: "fail",
        message: "✗ Could not read package.json",
      });
    }

    deps.status = deps.score >= 12 ? "good" : deps.score >= 8 ? "warning" : "fail";
    this.results.categories.dependencies = deps;
  }

  async checkBuildStatus() {
    console.log("🔨 Checking Build Status...");

    const build = {
      name: "Build Status",
      score: 0,
      total: 20,
      checks: [],
      status: "unknown",
    };

    // Check if build works
    try {
      execSync("npm run build", { stdio: "pipe" });
      build.checks.push({
        name: "Production Build",
        status: "pass",
        message: "✓ Builds successfully",
      });
      build.score += 10;
    } catch (error) {
      build.checks.push({
        name: "Production Build",
        status: "fail",
        message: "✗ Build fails",
      });
    }

    // Check if dev server starts
    try {
      const devProcess = execSync("timeout 5 npm run dev", { stdio: "pipe" });
      build.checks.push({
        name: "Development Server",
        status: "pass",
        message: "✓ Dev server starts",
      });
      build.score += 5;
    } catch (error) {
      build.checks.push({
        name: "Development Server",
        status: "warning",
        message: "⚠ Dev server check inconclusive",
      });
      build.score += 2;
    }

    // Check if dist folder exists and has content
    const distExists = fs.existsSync("dist");
    const hasClientAssets = distExists && fs.existsSync("dist/client");
    const hasServerAssets = distExists && fs.existsSync("dist/server");

    build.checks.push({
      name: "Build Output",
      status: distExists && hasClientAssets && hasServerAssets ? "pass" : "fail",
      message:
        distExists && hasClientAssets && hasServerAssets ? "✓ Complete build output" : "✗ Incomplete build output",
    });
    if (distExists && hasClientAssets && hasServerAssets) build.score += 5;

    build.status = build.score >= 15 ? "good" : build.score >= 10 ? "warning" : "fail";
    this.results.categories.build = build;
  }

  async checkCodeQuality() {
    console.log("🧹 Checking Code Quality...");

    const quality = {
      name: "Code Quality",
      score: 0,
      total: 15,
      checks: [],
      status: "unknown",
    };

    // ESLint check
    try {
      execSync("npm run lint", { stdio: "pipe" });
      quality.checks.push({
        name: "ESLint",
        status: "pass",
        message: "✓ No linting errors",
      });
      quality.score += 5;
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || "";
      const errorCount = (output.match(/error/g) || []).length;
      quality.checks.push({
        name: "ESLint",
        status: errorCount > 0 ? "fail" : "warning",
        message: errorCount > 0 ? `✗ ${errorCount} linting errors` : "⚠ Linting warnings",
      });
      quality.score += errorCount > 0 ? 1 : 3;
    }

    // TypeScript check
    try {
      execSync("npx tsc --noEmit", { stdio: "pipe" });
      quality.checks.push({
        name: "TypeScript",
        status: "pass",
        message: "✓ No type errors",
      });
      quality.score += 5;
    } catch (error) {
      quality.checks.push({
        name: "TypeScript",
        status: "fail",
        message: "✗ TypeScript errors detected",
      });
      quality.score += 1;
    }

    // Check for TODO comments
    try {
      const todoFiles = execSync(
        'grep -r "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx" --include="*.astro" || true',
        { encoding: "utf8" }
      );
      const todoCount = todoFiles.split("\n").filter((line) => line.trim()).length;
      quality.checks.push({
        name: "Technical Debt",
        status: todoCount === 0 ? "pass" : "warning",
        message: todoCount === 0 ? "✓ No TODO comments" : `⚠ ${todoCount} TODO comments found`,
      });
      quality.score += todoCount === 0 ? 3 : 1;
    } catch (error) {
      quality.checks.push({
        name: "Technical Debt",
        status: "warning",
        message: "⚠ Could not check for TODOs",
      });
      quality.score += 2;
    }

    // Check for console.log statements
    try {
      const consoleLogs = execSync(
        'grep -r "console\." src/ --include="*.ts" --include="*.tsx" --include="*.astro" || true',
        { encoding: "utf8" }
      );
      const consoleCount = consoleLogs
        .split("\n")
        .filter((line) => line.trim() && !line.includes("console.error")).length;
      quality.checks.push({
        name: "Debug Code",
        status: consoleCount === 0 ? "pass" : "warning",
        message: consoleCount === 0 ? "✓ No debug console statements" : `⚠ ${consoleCount} console statements found`,
      });
      quality.score += consoleCount === 0 ? 2 : 1;
    } catch (error) {
      quality.checks.push({
        name: "Debug Code",
        status: "warning",
        message: "⚠ Could not check for debug code",
      });
      quality.score += 1;
    }

    quality.status = quality.score >= 12 ? "good" : quality.score >= 8 ? "warning" : "fail";
    this.results.categories.quality = quality;
  }

  async checkFunctionality() {
    console.log("⚙️ Checking Core Functionality...");

    const functionality = {
      name: "Core Functionality",
      score: 0,
      total: 15,
      checks: [],
      status: "unknown",
    };

    // Check if main page exists and has content
    const mainPageExists = fs.existsSync("src/pages/index.astro");
    functionality.checks.push({
      name: "Main Page",
      status: mainPageExists ? "pass" : "fail",
      message: mainPageExists ? "✓ Home page exists" : "✗ No home page",
    });
    if (mainPageExists) functionality.score += 3;

    // Check for interactive components
    const hasReactComponents =
      fs.existsSync("src/components") && fs.readdirSync("src/components").some((file) => file.endsWith(".tsx"));
    functionality.checks.push({
      name: "Interactive Components",
      status: hasReactComponents ? "pass" : "warning",
      message: hasReactComponents ? "✓ Has React components" : "⚠ No interactive components",
    });
    if (hasReactComponents) functionality.score += 3;

    // Check for layouts
    const hasLayout = fs.existsSync("src/layouts/Layout.astro");
    functionality.checks.push({
      name: "Layout System",
      status: hasLayout ? "pass" : "fail",
      message: hasLayout ? "✓ Layout system implemented" : "✗ No layout system",
    });
    if (hasLayout) functionality.score += 3;

    // Check for API routes
    const hasApiRoutes = fs.existsSync("src/pages/api");
    functionality.checks.push({
      name: "API Routes",
      status: hasApiRoutes ? "pass" : "warning",
      message: hasApiRoutes ? "✓ Has API endpoints" : "⚠ No API routes (may be client-only app)",
    });
    functionality.score += hasApiRoutes ? 3 : 2;

    // Check for error handling
    const hasErrorPage = fs.existsSync("src/pages/404.astro") || fs.existsSync("src/pages/error.astro");
    functionality.checks.push({
      name: "Error Handling",
      status: hasErrorPage ? "pass" : "warning",
      message: hasErrorPage ? "✓ Error pages implemented" : "⚠ No custom error pages",
    });
    functionality.score += hasErrorPage ? 3 : 1;

    functionality.status = functionality.score >= 12 ? "good" : functionality.score >= 8 ? "warning" : "fail";
    this.results.categories.functionality = functionality;
  }

  async checkPerformance() {
    console.log("⚡ Checking Performance...");

    const performance = {
      name: "Performance",
      score: 0,
      total: 10,
      checks: [],
      status: "unknown",
    };

    // Check bundle size (rough estimate)
    const distExists = fs.existsSync("dist");
    if (distExists) {
      try {
        const clientDir = "dist/client/_astro";
        if (fs.existsSync(clientDir)) {
          const files = fs.readdirSync(clientDir);
          const totalSize = files.reduce((sum, file) => {
            const stat = fs.statSync(path.join(clientDir, file));
            return sum + stat.size;
          }, 0);

          const sizeMB = totalSize / (1024 * 1024);
          performance.checks.push({
            name: "Bundle Size",
            status: sizeMB < 1 ? "pass" : sizeMB < 2 ? "warning" : "fail",
            message: `📊 Bundle size: ${sizeMB.toFixed(2)} MB`,
          });
          performance.score += sizeMB < 1 ? 4 : sizeMB < 2 ? 2 : 1;
        }
      } catch (error) {
        performance.checks.push({
          name: "Bundle Size",
          status: "warning",
          message: "⚠ Could not check bundle size",
        });
        performance.score += 1;
      }
    }

    // Check for image optimization
    const hasImages = fs.existsSync("src/assets") || fs.existsSync("public");
    const hasImageIntegration =
      fs.existsSync("astro.config.mjs") && fs.readFileSync("astro.config.mjs", "utf8").includes("@astrojs/image");

    performance.checks.push({
      name: "Image Optimization",
      status: hasImageIntegration ? "pass" : hasImages ? "warning" : "pass",
      message: hasImageIntegration
        ? "✓ Image optimization configured"
        : hasImages
          ? "⚠ Images present but no optimization"
          : "✓ No images to optimize",
    });
    performance.score += hasImageIntegration ? 3 : hasImages ? 1 : 3;

    // Check for lazy loading
    const hasLazyLoading =
      fs.existsSync("src/components") &&
      fs.readdirSync("src/components").some((file) => {
        if (!file.endsWith(".tsx")) return false;
        const content = fs.readFileSync(path.join("src/components", file), "utf8");
        return content.includes("React.lazy") || content.includes("lazy(");
      });

    performance.checks.push({
      name: "Code Splitting",
      status: hasLazyLoading ? "pass" : "warning",
      message: hasLazyLoading ? "✓ Code splitting implemented" : "⚠ Consider code splitting for large components",
    });
    performance.score += hasLazyLoading ? 3 : 1;

    performance.status = performance.score >= 8 ? "good" : performance.score >= 5 ? "warning" : "fail";
    this.results.categories.performance = performance;
  }

  async checkSecurity() {
    console.log("🔒 Checking Security...");

    const security = {
      name: "Security",
      score: 0,
      total: 5,
      checks: [],
      status: "unknown",
    };

    // Check for environment variables usage
    const hasEnvUsage = fs.existsSync("src") && this.searchInFiles("import.meta.env", "src");

    security.checks.push({
      name: "Environment Variables",
      status: hasEnvUsage ? "pass" : "warning",
      message: hasEnvUsage ? "✓ Uses environment variables" : "⚠ No environment variables detected",
    });
    security.score += hasEnvUsage ? 2 : 1;

    // Check for HTTPS redirect (basic check)
    const hasHttpsConfig =
      fs.existsSync("astro.config.mjs") && fs.readFileSync("astro.config.mjs", "utf8").includes("https");

    security.checks.push({
      name: "HTTPS Configuration",
      status: hasHttpsConfig ? "pass" : "warning",
      message: hasHttpsConfig ? "✓ HTTPS configured" : "⚠ HTTPS not explicitly configured",
    });
    security.score += hasHttpsConfig ? 2 : 1;

    // Check for security headers (basic check)
    const hasSecurityHeaders =
      fs.existsSync("src/middleware/index.ts") &&
      fs.readFileSync("src/middleware/index.ts", "utf8").includes("security");

    security.checks.push({
      name: "Security Headers",
      status: hasSecurityHeaders ? "pass" : "warning",
      message: hasSecurityHeaders ? "✓ Security headers configured" : "⚠ No security headers detected",
    });
    security.score += hasSecurityHeaders ? 1 : 0;

    security.status = security.score >= 4 ? "good" : security.score >= 2 ? "warning" : "fail";
    this.results.categories.security = security;
  }

  searchInFiles(pattern, dir) {
    try {
      const result = execSync(`grep -r "${pattern}" ${dir} || true`, { encoding: "utf8" });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  calculateOverallScore() {
    const categories = Object.values(this.results.categories);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    const totalPossible = categories.reduce((sum, cat) => sum + cat.total, 0);

    this.results.overall.score = totalScore;
    this.results.overall.total = totalPossible;
    this.results.overall.status =
      totalScore >= totalPossible * 0.8 ? "good" : totalScore >= totalPossible * 0.6 ? "warning" : "fail";
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 MVP STATUS REPORT");
    console.log("=".repeat(60));

    const overall = this.results.overall;
    const statusEmoji = overall.status === "good" ? "✅" : overall.status === "warning" ? "⚠️" : "❌";
    const statusText =
      overall.status === "good"
        ? "READY FOR MVP"
        : overall.status === "warning"
          ? "NEEDS IMPROVEMENTS"
          : "NOT READY FOR MVP";

    console.log(`${statusEmoji} Overall Status: ${statusText}`);
    console.log(`📊 Score: ${overall.score}/${overall.total} (${Math.round((overall.score / overall.total) * 100)}%)`);
    console.log("");

    Object.values(this.results.categories).forEach((category) => {
      const catEmoji = category.status === "good" ? "✅" : category.status === "warning" ? "⚠️" : "❌";
      console.log(`${catEmoji} ${category.name}: ${category.score}/${category.total}`);

      category.checks.forEach((check) => {
        const checkEmoji = check.status === "pass" ? "  ✓" : check.status === "fail" ? "  ✗" : "  ⚠";
        console.log(`${checkEmoji} ${check.message}`);
      });
      console.log("");
    });

    // Recommendations
    console.log("💡 RECOMMENDATIONS:");
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec) => console.log(`• ${rec}`));

    console.log("\n" + "=".repeat(60));
  }

  generateRecommendations() {
    const recommendations = [];

    // Based on scores, provide specific recommendations
    const categories = this.results.categories;

    if (categories.quality?.score < categories.quality?.total * 0.8) {
      recommendations.push("Fix linting errors and type issues before MVP deployment");
    }

    if (categories.build?.score < categories.build?.total) {
      recommendations.push("Ensure the build process completes successfully");
    }

    if (categories.functionality?.score < 10) {
      recommendations.push("Implement core user functionality and error handling");
    }

    if (categories.performance?.score < 6) {
      recommendations.push("Optimize bundle size and implement code splitting");
    }

    if (categories.security?.score < 3) {
      recommendations.push("Configure environment variables and basic security headers");
    }

    if (recommendations.length === 0) {
      recommendations.push("Project is well-prepared for MVP! Consider adding tests and monitoring.");
    }

    return recommendations;
  }
}

// Run the checker
async function main() {
  console.log("Starting MVP checker...");
  try {
    const checker = new MVPChecker();
    console.log("Created checker instance");
    const result = await checker.run();
    console.log("Checker completed");
    return result;
  } catch (error) {
    console.error("Error running MVP checker:", error);
    throw error;
  }
}

// Run immediately
main().catch(console.error);

export default MVPChecker;
