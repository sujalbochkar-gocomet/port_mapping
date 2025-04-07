import PortMatcher = require("../mapper");
import { promises as fs } from 'fs';
import connectDB = require('../../lib/db');

interface TestPort {
    Keyword: string;
    "Port Type": string;
    "Mapped Port ID": string;
}

async function main(): Promise<void> {
    try {
        // First connect to MongoDB
        console.log("Connecting to MongoDB...");
        await connectDB();
        console.log("MongoDB connection established successfully");

        const portsFilePath = "ports.json";
        const ports: TestPort[] = JSON.parse(await fs.readFile(portsFilePath, "utf-8"));

        // Initialize PortMatcher
        console.log("Initializing PortMatcher...");
        const portsData = await PortMatcher.loadPortsData();
        const portMatcher = new PortMatcher(portsData);
        console.log("PortMatcher initialized successfully");

        let matchedCount = 0;
        let unmatchedCount = 0;
        let emptyResultsCount = 0;
        let totalTime = 0;
        let processedCount = 0;
        const BATCH_SIZE = 500;
        let currentBatchContent = "# Port Mapping Test Results\n\n";
        let batchNumber = 1;
        let batchStartTime = performance.now();

        console.log(`\nStarting port mapping test with ${ports.length} test cases...\n`);
        currentBatchContent += `## Test Summary\n\n`;
        currentBatchContent += `- Total Test Cases: ${ports.length}\n\n`;

        for (const port of ports) {
            const startTime = performance.now();
            const results = await portMatcher.aggregatedResults(port["Keyword"], port["Port Type"]);
            const endTime = performance.now();
            const timeTaken = endTime - startTime;
            totalTime += timeTaken;

            if (!results || results.length === 0) {
                emptyResultsCount++;
                console.log(`❌ Empty Results: "${port["Keyword"]}" (${port["Port Type"]}) - ${timeTaken.toFixed(2)}ms`);
                console.log(`   Expected: ${port["Mapped Port ID"]}`);
                currentBatchContent += `### ❌ Empty Results\n`;
                currentBatchContent += `- Keyword: "${port["Keyword"]}"\n`;
                currentBatchContent += `- Port Type: ${port["Port Type"]}\n`;
                currentBatchContent += `- Expected: ${port["Mapped Port ID"]}\n`;
                currentBatchContent += `- Time: ${timeTaken.toFixed(2)}ms\n\n`;

            } else if (results[0]?.port_data?.id === port["Mapped Port ID"]) {
                matchedCount++;
                console.log(`✅ Matched: "${port["Keyword"]}" -> ${results[0].port_data.name} (${timeTaken.toFixed(2)}ms)`);
                currentBatchContent += `### ✅ Matched\n`;
                currentBatchContent += `- Keyword: "${port["Keyword"]}"\n`;
                currentBatchContent += `- Mapped To: ${results[0].port_data.name}\n`;
                currentBatchContent += `- Time: ${timeTaken.toFixed(2)}ms\n\n`;
            } else {
                unmatchedCount++;
                console.log(`❌ Unmatched: "${port["Keyword"]}"`);
                console.log(`   Expected: ${port["Mapped Port ID"]}`);
                console.log(`   Got: ${results[0]?.port_data?.id || 'No ID'}`);
                console.log(`   Time: ${timeTaken.toFixed(2)}ms`);
                console.log(`   Matched using ${results[0].match_type} and sources are ${results[0].sources.join(', ')}`);
                currentBatchContent += `### ❌ Unmatched\n`;
                currentBatchContent += `- Keyword: "${port["Keyword"]}"\n`;
                currentBatchContent += `- Expected: ${port["Mapped Port ID"]}\n`;
                currentBatchContent += `- Got: ${results[0]?.port_data?.id || 'No ID'}\n`;
                currentBatchContent += `- Time: ${timeTaken.toFixed(2)}ms\n`;
                currentBatchContent += `- Match Type: ${results[0].match_type}\n`;
                currentBatchContent += `- Sources: ${results[0].sources.join(', ')}\n\n`;
            }

            processedCount++;

            // Save batch results and start new batch after every BATCH_SIZE test cases
            if (processedCount % BATCH_SIZE === 0 || processedCount === ports.length) {
                const batchEndTime = performance.now();
                const batchTotalTime = batchEndTime - batchStartTime;

                // Add batch summary to current batch content
                currentBatchContent += `## Batch ${batchNumber} Summary\n\n`;
                currentBatchContent += `- Processed: ${processedCount}/${ports.length}\n`;
                currentBatchContent += `- Batch Accuracy: ${((matchedCount / processedCount) * 100).toFixed(2)}%\n`;
                currentBatchContent += `- Matched: ${matchedCount}\n`;
                currentBatchContent += `- Unmatched: ${unmatchedCount}\n`;
                currentBatchContent += `- Empty Results: ${emptyResultsCount}\n`;
                currentBatchContent += `- Batch Time: ${batchTotalTime.toFixed(2)}ms\n`;
                currentBatchContent += `- Average Time per Query: ${(batchTotalTime / (processedCount % BATCH_SIZE || BATCH_SIZE)).toFixed(2)}ms\n\n`;

                // Save current batch to file
                await fs.writeFile(`portsFilePath_batch_${batchNumber}.md`, currentBatchContent);
                console.log(`\nBatch ${batchNumber} results saved to portsFilePath_batch_${batchNumber}.md`);

                // Reset for next batch
                if (processedCount < ports.length) {
                    batchNumber++;
                    currentBatchContent = "# Port Mapping Test Results\n\n";
                    currentBatchContent += `## Test Summary (Batch ${batchNumber})\n\n`;
                    currentBatchContent += `- Total Test Cases: ${ports.length}\n`;
                    currentBatchContent += `- Starting from: ${processedCount + 1}\n\n`;
                    batchStartTime = performance.now();
                }
            }
        }

        // Create final summary file
        let summaryContent = `# Port Mapping Test Final Summary\n\n`;
        summaryContent += `## Overall Statistics\n\n`;
        summaryContent += `- Total Test Cases: ${ports.length}\n`;
        summaryContent += `- ✅ Matched: ${matchedCount}\n`;
        summaryContent += `- ❌ Unmatched: ${unmatchedCount}\n`;
        summaryContent += `- ⚠️ Empty Results: ${emptyResultsCount}\n`;
        summaryContent += `- Total Time: ${totalTime.toFixed(2)}ms\n`;
        summaryContent += `- Average Time per Query: ${(totalTime / ports.length).toFixed(2)}ms\n`;
        summaryContent += `- Final Success Rate: ${((matchedCount / ports.length) * 100).toFixed(2)}%\n\n`;
        summaryContent += `## Batch Files\n\n`;
        for (let i = 1; i <= batchNumber; i++) {
            summaryContent += `- [Batch ${i} Results](./portsFilePath_batch_${i}.md)\n`;
        }

        // Save final summary
        await fs.writeFile('portsFilePath_summary.md', summaryContent);
        console.log("\nFinal summary saved to portsFilePath_ssummary.md");

        console.log("\n=== Final Test Results ===");
        console.log(`Total Test Cases: ${ports.length}`);
        console.log(`✅ Matched: ${matchedCount}`);
        console.log(`❌ Unmatched: ${unmatchedCount}`);
        console.log(`⚠️ Empty Results: ${emptyResultsCount}`);
        console.log(`\nFinal Performance:`);
        console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
        console.log(`Average Time per Query: ${(totalTime / ports.length).toFixed(2)}ms`);
        console.log(`Final Success Rate: ${((matchedCount / ports.length) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error("Error:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
        process.exit(1);
    }
}

main(); 