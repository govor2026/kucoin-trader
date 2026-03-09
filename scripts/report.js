const { KuCoinClient, getConfig } = require('../lib/kucoin-client');

async function runReport() {
    try {
        const client = new KuCoinClient(getConfig());

        console.log('\n📊 **KuCoin (KC) 交易报告**\n');

        const accountsData = await client.getAccounts();
        if (accountsData.error) {
            console.error('Error fetching accounts:', accountsData.error);
            return;
        }

        const accountsByType = {};
        accountsData.forEach(acc => {
            if (!accountsByType[acc.type]) {
                accountsByType[acc.type] = [];
            }
            const balance = parseFloat(acc.balance);
            if (balance > 0) {
                accountsByType[acc.type].push(acc);
            }
        });

        console.log('💰 **账户概览:**');
        for (const [type, accounts] of Object.entries(accountsByType)) {
            console.log(`\n  [${type.toUpperCase()}]`);
            accounts.forEach(acc => {
                console.log(`    ${acc.currency}: ${parseFloat(acc.balance).toFixed(6)} (可用: ${parseFloat(acc.available).toFixed(6)})`);
            });
        }

        console.log('\n\n📈 **最近订单 (最近10笔):**');
        const orders = await client.getOrders({ status: 'active' });
        if (!orders.error && orders.length > 0) {
            orders.slice(0, 10).forEach(order => {
                const side = order.side === 'buy' ? '买入' : '卖出';
                const type = order.type === 'limit' ? '限价' : '市价';
                console.log(`  • ${order.symbol} - ${side} ${order.size} @ ${order.price || '市价'} (${type}) - ${order.isActive ? '进行中' : '已完成'}`);
            });
        } else {
            console.log('  (无活跃订单)');
        }

        const now = new Date();
        console.log(`\n*报告生成时间: ${now.toISOString().replace('T', ' ').slice(0, 19)}*`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

runReport();
