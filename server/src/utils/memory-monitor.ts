export class MemoryMonitor {
    private static formatBytes(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    public static logMemoryUsage(label: string = ''): void {
        const memoryUsage = process.memoryUsage();
        console.log(`\n📊 Memory Usage ${label ? `(${label})` : ''}`);
        console.log('🔸 Heap Used:', this.formatBytes(memoryUsage.heapUsed));
        console.log('🔸 Heap Total:', this.formatBytes(memoryUsage.heapTotal));
        console.log('🔸 RSS:', this.formatBytes(memoryUsage.rss));
        console.log('🔸 External:', this.formatBytes(memoryUsage.external));
        if (global.gc) {
            console.log('♻️  Triggering garbage collection...');
            global.gc();
            const afterGC = process.memoryUsage();
            console.log('📉 After GC - Heap Used:', this.formatBytes(afterGC.heapUsed));
        }
        console.log('-------------------');
    }

    public static startMonitoring(intervalMs: number = 60000): NodeJS.Timer {
        return setInterval(() => {
            this.logMemoryUsage('Periodic Check');
        }, intervalMs);
    }
}
