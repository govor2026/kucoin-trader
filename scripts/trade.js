const { KuCoinClient, getConfig } = require('../lib/kucoin-client');

const args = process.argv.slice(2);
let params = {
    symbol: 'BTC-USDT',
    side: 'buy',
    type: 'limit',
    price: '0',
    size: '0'
};

for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) params[key] = value;
}

async function runTrade() {
    try {
        const client = new KuCoinClient(getConfig());
        
        const orderType = params.type === 'market' ? '市价' : '限价';
        const sideLabel = params.side === 'buy' ? '买入' : '卖出';
        
        console.log(`\n📝 **提交订单**`);
        console.log(`  • 交易对: ${params.symbol}`);
        console.log(`  • 方向: ${sideLabel}`);
        console.log(`  • 类型: ${orderType}`);
        if (params.type === 'limit') {
            console.log(`  • 价格: ${params.price} USDT`);
        }
        console.log(`  • 数量: ${params.size}\n`);

        const orderParams = {
            clientOid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            side: params.side,
            symbol: params.symbol,
            type: params.type,
            size: params.size
        };

        if (params.type === 'limit' && params.price) {
            orderParams.price = params.price;
        }

        const result = await client.createOrder(orderParams);

        if (result.error) {
            console.error('❌ 下单失败:', result.error);
            process.exit(1);
        }

        console.log('✅ **下单成功**');
        console.log(`  • 订单ID: ${result.orderId || 'N/A'}`);
        console.log(`  • Client OID: ${orderParams.clientOid}`);
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

runTrade();
