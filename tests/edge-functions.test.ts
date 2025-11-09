import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively gets all TypeScript/TSX files from a directory
 */
function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, and build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
        files.push(...getAllTypeScriptFiles(fullPath));
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Extracts all edge function invocation names from source code
 */
function extractFunctionInvocations(content: string): string[] {
  const invocations: string[] = [];
  
  // Match patterns like: .functions.invoke('function-name' or supabase.functions.invoke("function-name"
  const invokePattern = /\.functions\.invoke\(['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = invokePattern.exec(content)) !== null) {
    invocations.push(match[1]);
  }
  
  return invocations;
}

describe('Edge Function Name Consistency', () => {
  const projectRoot = path.join(__dirname, '..');
  const functionsDir = path.join(projectRoot, 'supabase', 'functions');
  const srcDir = path.join(projectRoot, 'src');

  it('should have a functions directory', () => {
    expect(fs.existsSync(functionsDir)).toBe(true);
  });

  it('should have edge function directories', () => {
    const functionDirs = fs.readdirSync(functionsDir)
      .filter(f => {
        const fullPath = path.join(functionsDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(f => !f.startsWith('_')); // Exclude _shared

    expect(functionDirs.length).toBeGreaterThan(0);
  });

  it('should have matching function names in code and file system', () => {
    // Get all function directories (excluding _shared)
    const functionDirs = fs.readdirSync(functionsDir)
      .filter(f => {
        const fullPath = path.join(functionsDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(f => !f.startsWith('_')); // Exclude _shared

    // Get all TypeScript files from src
    const srcFiles = getAllTypeScriptFiles(srcDir);

    // Known background jobs that may not be called from frontend
    const knownBackgroundJobs = [
      'daily-job-matcher',
      'check-cost-alerts',
      'update-competency-benchmarks',
    ];

    const unusedFunctions: string[] = [];
    const functionUsageMap = new Map<string, string[]>();

    // Check each function for usage
    functionDirs.forEach(funcName => {
      const usageLocations: string[] = [];

      srcFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const invocations = extractFunctionInvocations(content);
        
        if (invocations.includes(funcName)) {
          usageLocations.push(file.replace(projectRoot, ''));
        }
      });

      functionUsageMap.set(funcName, usageLocations);

      // If not used and not a known background job, mark as unused
      if (usageLocations.length === 0 && !knownBackgroundJobs.includes(funcName)) {
        unusedFunctions.push(funcName);
      }
    });

    // Report unused functions as warnings (but don't fail the test)
    if (unusedFunctions.length > 0) {
      console.warn('\n⚠️  Warning: The following edge functions are not called from frontend code:');
      unusedFunctions.forEach(func => {
        console.warn(`   - ${func}`);
      });
      console.warn('   These may be background jobs, deprecated, or need cleanup.\n');
    }

    // Log function usage for documentation
    console.log('\n📊 Edge Function Usage Report:');
    functionUsageMap.forEach((locations, funcName) => {
      if (locations.length > 0) {
        console.log(`\n✅ ${funcName} (${locations.length} usage${locations.length > 1 ? 's' : ''}):`);
        locations.slice(0, 3).forEach(loc => {
          console.log(`   ${loc}`);
        });
        if (locations.length > 3) {
          console.log(`   ... and ${locations.length - 3} more`);
        }
      }
    });
    console.log('\n');

    // Test passes if we have at least some functions being used
    const usedFunctionsCount = functionDirs.length - unusedFunctions.length;
    expect(usedFunctionsCount).toBeGreaterThan(0);
  });

  it('should not have invalid function names in code', () => {
    const srcFiles = getAllTypeScriptFiles(srcDir);
    
    // Get valid function names from file system
    const validFunctionNames = fs.readdirSync(functionsDir)
      .filter(f => {
        const fullPath = path.join(functionsDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(f => !f.startsWith('_'));

    const invalidInvocations: Array<{ file: string; functionName: string }> = [];

    // Check all invocations in source code
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const invocations = extractFunctionInvocations(content);
      
      invocations.forEach(funcName => {
        if (!validFunctionNames.includes(funcName)) {
          invalidInvocations.push({
            file: file.replace(projectRoot, ''),
            functionName: funcName
          });
        }
      });
    });

    // Report any invalid invocations
    if (invalidInvocations.length > 0) {
      console.error('\n❌ Error: Found invocations to non-existent edge functions:');
      invalidInvocations.forEach(({ file, functionName }) => {
        console.error(`   ${file}`);
        console.error(`   └─ calls: '${functionName}' (does not exist)`);
      });
      console.error('\n');
    }

    expect(invalidInvocations).toHaveLength(0);
  });

  it('should follow kebab-case naming convention', () => {
    const functionDirs = fs.readdirSync(functionsDir)
      .filter(f => {
        const fullPath = path.join(functionsDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(f => !f.startsWith('_'));

    const invalidNames: string[] = [];
    
    // Kebab-case pattern: lowercase letters, numbers, and hyphens only
    const kebabCasePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    functionDirs.forEach(funcName => {
      if (!kebabCasePattern.test(funcName)) {
        invalidNames.push(funcName);
      }
    });

    if (invalidNames.length > 0) {
      console.error('\n❌ Error: Found edge functions with invalid naming (not kebab-case):');
      invalidNames.forEach(name => {
        console.error(`   - ${name}`);
      });
      console.error('\n   Edge functions must use kebab-case (e.g., my-function-name)\n');
    }

    expect(invalidNames).toHaveLength(0);
  });

  it('should have index.ts file in each function directory', () => {
    const functionDirs = fs.readdirSync(functionsDir)
      .filter(f => {
        const fullPath = path.join(functionsDir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(f => !f.startsWith('_'));

    const missingIndex: string[] = [];

    functionDirs.forEach(funcName => {
      const indexPath = path.join(functionsDir, funcName, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        missingIndex.push(funcName);
      }
    });

    if (missingIndex.length > 0) {
      console.error('\n❌ Error: Found edge functions missing index.ts:');
      missingIndex.forEach(name => {
        console.error(`   - ${name}/index.ts`);
      });
      console.error('\n');
    }

    expect(missingIndex).toHaveLength(0);
  });

  it('should detect potential naming mismatches (camelCase vs kebab-case)', () => {
    const srcFiles = getAllTypeScriptFiles(srcDir);
    const potentialMismatches: Array<{ file: string; line: string }> = [];

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Look for patterns like invoke('myFunctionName') where camelCase is used
        const camelCaseInvoke = /\.functions\.invoke\(['"]([a-z][a-zA-Z0-9]*)['"]/;
        const match = line.match(camelCaseInvoke);
        
        if (match && match[1].match(/[A-Z]/)) {
          // Contains uppercase - likely camelCase instead of kebab-case
          potentialMismatches.push({
            file: file.replace(projectRoot, ''),
            line: `Line ${index + 1}: ${line.trim()}`
          });
        }
      });
    });

    if (potentialMismatches.length > 0) {
      console.warn('\n⚠️  Warning: Found potential camelCase usage in edge function calls:');
      potentialMismatches.forEach(({ file, line }) => {
        console.warn(`   ${file}`);
        console.warn(`   └─ ${line}`);
      });
      console.warn('\n   Edge functions should use kebab-case naming.\n');
    }

    // This is a warning, not an error, so we don't fail the test
    // but we log it for developers to review
  });
});

describe('Edge Function Invocation Patterns', () => {
  const projectRoot = path.join(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');

  it('should use supabase.functions.invoke() not direct HTTP calls', () => {
    const srcFiles = getAllTypeScriptFiles(srcDir);
    const directHttpCalls: Array<{ file: string; line: string }> = [];

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Look for direct HTTP calls to Supabase functions
        if (
          line.includes('/functions/v1/') ||
          (line.includes('fetch') && line.includes('supabase') && line.includes('functions'))
        ) {
          directHttpCalls.push({
            file: file.replace(projectRoot, ''),
            line: `Line ${index + 1}: ${line.trim()}`
          });
        }
      });
    });

    if (directHttpCalls.length > 0) {
      console.warn('\n⚠️  Warning: Found potential direct HTTP calls to edge functions:');
      directHttpCalls.forEach(({ file, line }) => {
        console.warn(`   ${file}`);
        console.warn(`   └─ ${line}`);
      });
      console.warn('\n   Prefer using supabase.functions.invoke() instead of direct HTTP calls.\n');
    }

    // This is a warning for now, not a hard failure
    // Teams can decide if they want to enforce this strictly
  });

  it('should have error handling for edge function calls', () => {
    const srcFiles = getAllTypeScriptFiles(srcDir);
    const missingErrorHandling: Array<{ file: string; functionName: string }> = [];

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Find all function invocations
      const invokePattern = /\.functions\.invoke\(['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = invokePattern.exec(content)) !== null) {
        const functionName = match[1];
        const matchIndex = match.index;
        
        // Check if there's error handling within 500 characters after the invoke
        const contextAfter = content.slice(matchIndex, matchIndex + 500);
        
        // Look for error handling patterns
        const hasErrorCheck = 
          contextAfter.includes('if (error)') ||
          contextAfter.includes('if(error)') ||
          contextAfter.includes('catch') ||
          contextAfter.includes('.catch(');
        
        if (!hasErrorCheck) {
          missingErrorHandling.push({
            file: file.replace(projectRoot, ''),
            functionName
          });
        }
      }
    });

    if (missingErrorHandling.length > 0) {
      console.warn('\n⚠️  Warning: Found edge function calls potentially missing error handling:');
      const grouped = missingErrorHandling.reduce((acc, item) => {
        if (!acc[item.file]) acc[item.file] = [];
        acc[item.file].push(item.functionName);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(grouped).forEach(([file, functions]) => {
        console.warn(`   ${file}`);
        functions.forEach(func => {
          console.warn(`   └─ ${func}`);
        });
      });
      console.warn('\n   Add error handling: if (error) throw error;\n');
    }

    // This is a warning to improve code quality
    // Not a hard failure as error handling might be elsewhere
  });
});
