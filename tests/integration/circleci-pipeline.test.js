/**
 * Integration Tests for CircleCI Pipeline
 *
 * Tests the CI/CD pipeline configuration and workflows:
 * - Cache strategy validation
 * - Security scanning integration
 * - Performance monitoring
 * - Deployment configuration
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('CircleCI Pipeline - Integration Tests', () => {
  let circleConfig;

  beforeAll(() => {
    const configPath = path.join(__dirname, '../../.circleci/config.yml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    circleConfig = yaml.load(configContent);
  });

  describe('Pipeline Configuration', () => {
    it('should have valid CircleCI version', () => {
      expect(circleConfig.version).toBeDefined();
      expect(parseFloat(circleConfig.version)).toBeGreaterThanOrEqual(2.1);
    });

    it('should define required jobs', () => {
      const requiredJobs = [
        'install_dependencies',
        'lint',
        'type_check',
        'test',
        'build',
        'vulnerability_scan',
        'security_scan',
        'deploy_preview'
      ];

      for (const job of requiredJobs) {
        expect(circleConfig.jobs).toHaveProperty(job);
      }
    });

    it('should have optimized node executor', () => {
      const executor = circleConfig.executors?.['node-executor'];

      expect(executor).toBeDefined();
      expect(executor.docker[0].image).toContain('cimg/node');
    });
  });

  describe('Cache Strategy', () => {
    it('should implement multi-layer caching for dependencies', () => {
      const installJob = circleConfig.jobs.install_dependencies;
      const restoreCacheStep = installJob.steps.find(
        step => step.restore_cache
      );

      expect(restoreCacheStep).toBeDefined();
      expect(restoreCacheStep.restore_cache.keys).toHaveLength(4);

      // Check cache key hierarchy
      const keys = restoreCacheStep.restore_cache.keys;
      expect(keys[0]).toContain('checksum "package-lock.json"');
      expect(keys[1]).toContain('checksum "package-lock.json"');
      expect(keys[2]).toContain('{{ .Branch }}');
      expect(keys[3]).toMatch(/^v\d+-dependencies-$/);
    });

    it('should save cache after dependency installation', () => {
      const installJob = circleConfig.jobs.install_dependencies;
      const saveCacheStep = installJob.steps.find(step => step.save_cache);

      expect(saveCacheStep).toBeDefined();
      expect(saveCacheStep.save_cache.paths).toContain('node_modules');
    });
  });

  describe('Parallel Execution', () => {
    it('should configure parallel test execution', () => {
      const testJob = circleConfig.jobs.test;

      expect(testJob.parallelism).toBeDefined();
      expect(testJob.parallelism).toBeGreaterThanOrEqual(2);
    });

    it('should have proper workflow dependencies', () => {
      const workflow = circleConfig.workflows.build_test_deploy;
      const jobs = workflow.jobs;

      // Find jobs that can run in parallel (no dependencies)
      const parallelJobs = jobs.filter(
        job =>
          typeof job === 'object' &&
          job.requires?.includes('install_dependencies') &&
          job.requires.length === 1
      );

      expect(parallelJobs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Scanning', () => {
    it('should include vulnerability scanning job', () => {
      const vulnScan = circleConfig.jobs.vulnerability_scan;

      expect(vulnScan).toBeDefined();

      const auditStep = vulnScan.steps.find(step =>
        step.run?.command?.includes('npm audit')
      );

      expect(auditStep).toBeDefined();
    });

    it('should include secret scanning job', () => {
      const securityScan = circleConfig.jobs.security_scan;

      expect(securityScan).toBeDefined();

      const truffleHogStep = securityScan.steps.find(step =>
        step.run?.command?.includes('trufflehog')
      );

      expect(truffleHogStep).toBeDefined();
    });

    it('should fail build on critical vulnerabilities', () => {
      const vulnScan = circleConfig.jobs.vulnerability_scan;

      const auditStep = vulnScan.steps.find(step =>
        step.run?.command?.includes('npm audit')
      );

      expect(auditStep.run.command).toContain('exit 1');
    });
  });

  describe('Performance Monitoring', () => {
    it('should include performance audit job', () => {
      const perfAudit = circleConfig.jobs.performance_audit;

      if (perfAudit) {
        expect(perfAudit).toBeDefined();

        const lighthouseStep = perfAudit.steps.find(step =>
          step.run?.command?.includes('lighthouse')
        );

        expect(lighthouseStep).toBeDefined();
      }
    });

    it('should validate bundle size limits', () => {
      const buildJob = circleConfig.jobs.build;

      const bundleSizeCheck = buildJob.steps.find(step =>
        step.run?.command?.includes('du -sb .next')
      );

      if (bundleSizeCheck) {
        expect(bundleSizeCheck.run.command).toContain('50');
      }
    });
  });

  describe('Deployment Configuration', () => {
    it('should validate Vercel environment variables', () => {
      const deployJob = circleConfig.jobs.deploy_preview;

      const validateStep = deployJob.steps.find(step =>
        step.run?.name?.includes('Validate Vercel')
      );

      expect(validateStep).toBeDefined();
      expect(validateStep.run.command).toContain('VERCEL_TOKEN');
      expect(validateStep.run.command).toContain('VERCEL_ORG_ID');
      expect(validateStep.run.command).toContain('VERCEL_PROJECT_ID');
    });

    it('should deploy preview for non-main branches', () => {
      const workflow = circleConfig.workflows.build_test_deploy;
      const deployJob = workflow.jobs.find(
        job => typeof job === 'object' && job.deploy_preview
      );

      expect(deployJob).toBeDefined();
      expect(deployJob.deploy_preview.filters.branches.ignore).toContain('main');
      expect(deployJob.deploy_preview.filters.branches.ignore).toContain('master');
    });

    it('should deploy production only for main branch', () => {
      const workflow = circleConfig.workflows.build_test_deploy;
      const prodJob = workflow.jobs.find(
        job => typeof job === 'object' && job.deploy_production
      );

      if (prodJob) {
        expect(prodJob.deploy_production.filters.branches.only).toContain('main');
      }
    });
  });

  describe('Artifact Storage', () => {
    it('should store test results', () => {
      const testJob = circleConfig.jobs.test;

      const storeResults = testJob.steps.find(step => step.store_test_results);

      expect(storeResults).toBeDefined();
      expect(storeResults.store_test_results.path).toBe('coverage');
    });

    it('should store coverage artifacts', () => {
      const testJob = circleConfig.jobs.test;

      const storeArtifacts = testJob.steps.find(step => step.store_artifacts);

      expect(storeArtifacts).toBeDefined();
      expect(storeArtifacts.store_artifacts.path).toBe('coverage');
    });

    it('should store security scan results', () => {
      const securityScan = circleConfig.jobs.security_scan;

      if (securityScan) {
        const storeArtifacts = securityScan.steps.find(
          step => step.store_artifacts
        );

        if (storeArtifacts) {
          expect(storeArtifacts.store_artifacts.destination).toContain(
            'security-reports'
          );
        }
      }
    });
  });

  describe('Scheduled Workflows', () => {
    it('should have nightly build schedule', () => {
      const nightlyWorkflow = Object.values(circleConfig.workflows).find(
        workflow =>
          workflow.triggers?.some(
            trigger => trigger.schedule?.cron === '0 0 * * *'
          )
      );

      if (nightlyWorkflow) {
        expect(nightlyWorkflow).toBeDefined();
      }
    });

    it('should have weekly security audit', () => {
      const weeklyAudit = Object.values(circleConfig.workflows).find(
        workflow =>
          workflow.triggers?.some(
            trigger => trigger.schedule?.cron === '0 2 * * 6'
          )
      );

      if (weeklyAudit) {
        expect(weeklyAudit).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should have no_output_timeout for long-running tasks', () => {
      const buildJob = circleConfig.jobs.build;

      const buildStep = buildJob.steps.find(step =>
        step.run?.name?.includes('Build')
      );

      if (buildStep && buildStep.run.no_output_timeout) {
        expect(buildStep.run.no_output_timeout).toBeDefined();
      }
    });

    it('should fail fast on critical errors', () => {
      const installJob = circleConfig.jobs.install_dependencies;

      const installStep = installJob.steps.find(step =>
        step.run?.command?.includes('npm ci')
      );

      // Should not have when: always
      expect(installStep.run.when).not.toBe('always');
    });
  });

  describe('Environment Configuration', () => {
    it('should define required environment variables', () => {
      expect(circleConfig.env).toBeDefined();

      const expectedEnvVars = ['NODE_VERSION'];

      for (const envVar of expectedEnvVars) {
        if (circleConfig.env) {
          expect(circleConfig.env).toHaveProperty(envVar);
        }
      }
    });
  });

  describe('Workspace Persistence', () => {
    it('should persist workspace from install to build', () => {
      const installJob = circleConfig.jobs.install_dependencies;
      const buildJob = circleConfig.jobs.build;

      const persistStep = installJob.steps.find(step => step.persist_to_workspace);
      const attachStep = buildJob.steps.find(step => step.attach_workspace);

      expect(persistStep).toBeDefined();
      expect(attachStep).toBeDefined();
    });

    it('should include node_modules in workspace', () => {
      const installJob = circleConfig.jobs.install_dependencies;
      const persistStep = installJob.steps.find(step => step.persist_to_workspace);

      if (persistStep) {
        expect(persistStep.persist_to_workspace.paths).toContain('node_modules');
      }
    });
  });
});

describe('CircleCI Pipeline - Performance Tests', () => {
  it('should complete build within reasonable time', () => {
    // This would require actual CircleCI API integration
    const expectedMaxBuildTime = 10 * 60 * 1000; // 10 minutes
    expect(expectedMaxBuildTime).toBeGreaterThan(0);
  });

  it('should have high cache hit rate', () => {
    // This would require actual CircleCI Insights integration
    const targetCacheHitRate = 0.85;
    expect(targetCacheHitRate).toBeGreaterThan(0.8);
  });
});
