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

        const portsFilePath = "./ports.json";
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

        console.log(`\nStarting port mapping test with ${ports.length} test cases...\n`);

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

            } else if (results[0]?.port_data?.id === port["Mapped Port ID"]) {
                matchedCount++;
                console.log(`✅ Matched: "${port["Keyword"]}" -> ${results[0].port_data.name} (${timeTaken.toFixed(2)}ms)`);
            } else {
                unmatchedCount++;
                console.log(`❌ Unmatched: "${port["Keyword"]}"`);
                console.log(`   Expected: ${port["Mapped Port ID"]}`);
                console.log(`   Got: ${results[0]?.port_data?.id || 'No ID'}`);
                console.log(`   Time: ${timeTaken.toFixed(2)}ms`);
                console.log(`   Matched using ${results[0].match_type} and sources are ${results[0].sources.join(', ')}`);
            }

            processedCount++;

            // Show intermediate results after every BATCH_SIZE test cases
            if (processedCount % BATCH_SIZE === 0 || processedCount === ports.length) {
                console.log("\n=== Intermediate Results ===");
                console.log(`Processed ${processedCount} out of ${ports.length} test cases`);
                console.log(`Current Batch Accuracy: ${((matchedCount / processedCount) * 100).toFixed(2)}%`);
                console.log(`Current Batch Stats:`);
                console.log(`  ✅ Matched: ${matchedCount}`);
                console.log(`  ❌ Unmatched: ${unmatchedCount}`);
                console.log(`  ⚠️ Empty Results: ${emptyResultsCount}`);
                console.log(`  Average Time per Query: ${(totalTime / processedCount).toFixed(2)}ms`);
                console.log("=".repeat(50));
            }
        }

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