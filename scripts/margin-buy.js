const { KuCoinClient, getConfig } = require('../lib/kucoin-client');

async function main() {
    const client = new KuCoinClient(getConfig());
    
    const btcPrice = 68726.90;
    const marginBalance = 200;
    const leverage = 5;
    const totalUsdt = marginBalance * leverage;
    const borrowAmount = totalUsdt - marginBalance;
    
    console.log(`📊 当前账户信息:`);
    console.log(`  - 全仓杠杆账户余额: ${marginBalance} USDT`);
    console.log(`  - 目标杠杆倍数: ${leverage}x`);
    console.log(`  - 可用总资金: ${totalUsdt} USDT`);
    console.log(`  - 需要借款: ${borrowAmount} USDT`);
    console.log(`  - BTC价格: ${btcPrice} USDT\n`);
    
    console.log(`🔄 步骤1: 借款 ${borrowAmount} USDT...`);
    const borrowResult = await client.borrow({
        currency: 'USDT',
        amount: borrowAmount,
        type: 'CROSS'
    });
    
    if (borrowResult.error) {
        console.error('❌ 借款失败:', borrowResult.error);
        process.exit(1);
    }
    
    console.log('✅ 借款成功!\n');
    
    const btcSize = (totalUsdt / btcPrice).toFixed(6);
    console.log(`🔄 步骤2: 市价买入 BTC-USDT, 数量: ${btcSize} BTC...`);
    
    const orderResult = await client.marginOrder({
        clientOid: `margin_${Date.now()}`,
        side: 'buy',
        symbol: 'BTC-USDT',
        type: 'market',
        size: btcSize,
        marginType: 'CROSS'
    });
    
    if (orderResult.error) {
        console.error('❌ 下单失败:', orderResult.error);
        console.log('\n⚠️ 尝试还款...');
        await client.repay({
            currency: 'USDT',
            amount: borrowAmount,
            type: 'CROSS'
        });
        process.exit(1);
    }
    
    console.log('✅ 买入成功!');
    console.log('\n📊 交易摘要:');
    console.log(`  - 买入数量: ${btcSize} BTC`);
    console.log(`  - 约等于: ${(btcSize * btcPrice).toFixed(2)} USDT`);
    console.log(`  - 杠杆倍数: ${leverage}x`);
    console.log(`  - 借款金额: ${borrowAmount} USDT`);
    console.log(`  - 自有资金: ${marginBalance} USDT`);
    
    console.log('\n📊 更新后的全仓杠杆账户:');
    const marginAcc = await client.getMarginAccount();
    console.log(JSON.stringify(marginAcc, null, 2));
}

main().catch(console.error);
