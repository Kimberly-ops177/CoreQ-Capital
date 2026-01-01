const odbc = require('odbc');

// Test different connection string formats
const connectionStrings = [
    'Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=D:\\Users\\USER\\coreq capital.accdb;',
    'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=D:\\Users\\USER\\coreq capital.accdb;',
    'Driver=Microsoft Access Driver (*.mdb, *.accdb);DBQ=D:\\Users\\USER\\coreq capital.accdb;',
    'DSN=;Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=D:\\Users\\USER\\coreq capital.accdb;UID=;PWD=;'
];

async function testConnections() {
    console.log('Testing ODBC connection strings...\n');

    for (let i = 0; i < connectionStrings.length; i++) {
        console.log(`\nAttempt ${i + 1}:`);
        console.log(`Connection string: ${connectionStrings[i]}`);

        try {
            const connection = await odbc.connect(connectionStrings[i]);
            console.log('✅ SUCCESS! Connected to Access database');
            await connection.close();
            console.log('Connection closed successfully');
            break;
        } catch (error) {
            console.log('❌ FAILED:', error.message);
            if (error.odbcErrors) {
                error.odbcErrors.forEach(e => {
                    console.log(`   State: ${e.state}, Code: ${e.code}`);
                    console.log(`   Message: ${e.message}`);
                });
            }
        }
    }
}

testConnections().catch(console.error);
