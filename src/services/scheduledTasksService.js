const cron = require('node-cron');
const path = require('path');
const fs = require('fs').promises;

class ScheduledTasksService {
    constructor() {
        this.tasks = new Map();
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        
        console.log('🕒 Initializing scheduled tasks...');
        
        // Example: Clean up old temporary files every day at 2 AM
        this.addTask('cleanup-temp-files', '0 2 * * *', () => {
            this.cleanupTempFiles();
        });

        // Example: Generate usage reports every Monday at 9 AM
        this.addTask('weekly-report', '0 9 * * 1', () => {
            this.generateWeeklyReport();
        });

        // Example: Check disk space every hour
        this.addTask('disk-space-check', '0 * * * *', () => {
            this.checkDiskSpace();
        });

        this.isInitialized = true;
        console.log(`✅ Scheduled ${this.tasks.size} tasks successfully`);
    }

    addTask(name, cronExpression, taskFunction, options = {}) {
        try {
            const task = cron.schedule(cronExpression, taskFunction, {
                scheduled: false,
                timezone: options.timezone || 'America/New_York',
                ...options
            });
            
            this.tasks.set(name, {
                task,
                expression: cronExpression,
                description: options.description || name,
                lastRun: null,
                nextRun: null
            });
            
            console.log(`📅 Added scheduled task: ${name} (${cronExpression})`);
            return task;
        } catch (error) {
            console.error(`❌ Failed to add scheduled task ${name}:`, error.message);
            return null;
        }
    }

    startTask(name) {
        const taskInfo = this.tasks.get(name);
        if (taskInfo) {
            taskInfo.task.start();
            console.log(`▶️ Started task: ${name}`);
            return true;
        }
        console.error(`❌ Task not found: ${name}`);
        return false;
    }

    stopTask(name) {
        const taskInfo = this.tasks.get(name);
        if (taskInfo) {
            taskInfo.task.stop();
            console.log(`⏹️ Stopped task: ${name}`);
            return true;
        }
        console.error(`❌ Task not found: ${name}`);
        return false;
    }

    startAllTasks() {
        console.log('🚀 Starting all scheduled tasks...');
        for (const [name, taskInfo] of this.tasks) {
            taskInfo.task.start();
            console.log(`  ✅ ${name}: ${taskInfo.expression}`);
        }
    }

    stopAllTasks() {
        console.log('🛑 Stopping all scheduled tasks...');
        for (const [name, taskInfo] of this.tasks) {
            taskInfo.task.stop();
        }
    }

    getTaskStatus() {
        const status = {};
        for (const [name, taskInfo] of this.tasks) {
            status[name] = {
                expression: taskInfo.expression,
                description: taskInfo.description,
                isRunning: taskInfo.task.running,
                lastRun: taskInfo.lastRun,
                nextRun: taskInfo.nextRun
            };
        }
        return status;
    }

    // Example scheduled task functions
    async cleanupTempFiles() {
        try {
            console.log('🧹 Running cleanup task...');
            const tempDir = path.join(__dirname, '../../temp');
            
            // Check if temp directory exists
            try {
                await fs.access(tempDir);
                const files = await fs.readdir(tempDir);
                
                // Clean up files older than 24 hours
                const now = Date.now();
                let cleanedCount = 0;
                
                for (const file of files) {
                    const filePath = path.join(tempDir, file);
                    const stats = await fs.stat(filePath);
                    const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
                    
                    if (ageHours > 24) {
                        await fs.unlink(filePath);
                        cleanedCount++;
                    }
                }
                
                console.log(`✅ Cleanup complete: Removed ${cleanedCount} old files`);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
                console.log('ℹ️ No temp directory to clean');
            }
        } catch (error) {
            console.error('❌ Cleanup task failed:', error.message);
        }
    }

    async generateWeeklyReport() {
        try {
            console.log('📊 Generating weekly report...');
            
            const projectsDir = path.join(__dirname, '../../projects');
            const files = await fs.readdir(projectsDir);
            const projectFiles = files.filter(f => f.endsWith('.json'));
            
            const report = {
                date: new Date().toISOString(),
                totalProjects: projectFiles.length,
                projects: []
            };
            
            for (const projectFile of projectFiles) {
                try {
                    const projectPath = path.join(projectsDir, projectFile);
                    const projectData = JSON.parse(await fs.readFile(projectPath, 'utf8'));
                    
                    report.projects.push({
                        name: projectData.name,
                        createdAt: projectData.createdAt,
                        campaignCount: projectData.campaigns?.length || 0
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not read project file: ${projectFile}`);
                }
            }
            
            // Save report
            const reportsDir = path.join(__dirname, '../../reports');
            await fs.mkdir(reportsDir, { recursive: true });
            
            const reportPath = path.join(reportsDir, `weekly-report-${new Date().toISOString().split('T')[0]}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            console.log(`✅ Weekly report saved to: ${reportPath}`);
        } catch (error) {
            console.error('❌ Weekly report generation failed:', error.message);
        }
    }

    async checkDiskSpace() {
        try {
            const assetsDir = path.join(__dirname, '../../assets');
            
            // Simple disk space check by counting files
            try {
                const files = await fs.readdir(assetsDir, { recursive: true });
                const totalFiles = files.length;
                
                if (totalFiles > 1000) {
                    console.warn(`⚠️ High file count detected: ${totalFiles} files in assets directory`);
                }
                
                console.log(`💾 Disk check: ${totalFiles} files in assets directory`);
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
                console.log('ℹ️ Assets directory does not exist yet');
            }
        } catch (error) {
            console.error('❌ Disk space check failed:', error.message);
        }
    }
}

module.exports = ScheduledTasksService;
