const { KuCoinClient, getConfig } = require('../lib/kucoin-client');

const args = process.argv.slice(2);
const command = args[0];
const params = {};

for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) params[key] = value;
}

const COMMANDS = {
    'enable': '启用逐仓杠杆',
    'disable': '禁用逐仓杠杆',
    'info': '查询逐仓杠杆账户信息',
    'config': '查询逐仓杠杆配置',
    'borrowable': '查询可借额度',
    'borrow': '借币',
    'repay': '还币',
    'trade': '逐仓杠杆交易下单',
    'orders': '查询逐仓杠杆订单',
    'cancel': '取消逐仓杠杆订单',
    'transfer-in': '从主账户划入逐仓杠杆',
    'transfer-out': '从逐仓杠杆划出'
};

async function runIsolatedCommand() {
    const client = new KuCoinClient(getConfig());

    if (!command || command === 'help' || command === '--help') {
        console.log('\n📈 **KuCoin 逐仓杠杆交易命令帮助**\n');
        console.log('用法: node isolated.js <命令> [参数]\n');
        console.log('可用命令:');
        for (const [cmd, desc] of Object.entries(COMMANDS)) {
            console.log(`  ${cmd.padEnd(12)} - ${desc}`);
        }
        console.log('\n示例:');
        console.log('  node isolated.js enable');
        console.log('  node isolated.js info');
        console.log('  node isolated.js info --symbol BTC-USDT');
        console.log('  node isolated.js borrowable --symbol BTC-USDT');
        console.log('  node isolated.js borrow --symbol BTC-USDT --amount 0.1');
        console.log('  node isolated.js repay --symbol BTC-USDT --amount 0.1');
        console.log('  node isolated.js trade --symbol BTC-USDT --side buy --size 0.01');
        console.log('  node isolated.js orders --symbol BTC-USDT');
        console.log('  node isolated.js transfer-in --symbol BTC-USDT --amount 0.1');
        return;
    }

    try {
        switch (command) {
            case 'enable':
                await enableIsolatedMargin(client);
                break;
            case 'disable':
                await disableIsolatedMargin(client);
                break;
            case 'info':
                await getIsolatedMarginInfo(client, params.currency, params.symbol);
                break;
            case 'config':
                await getIsolatedConfig(client);
                break;
            case 'borrowable':
                await getBorrowable(client, params.symbol);
                break;
            case 'borrow':
                await borrow(client, params.symbol, params.amount);
                break;
            case 'repay':
                await repay(client, params.symbol, params.amount);
                break;
            case 'trade':
                await isolatedTrade(client);
                break;
            case 'orders':
                await getOrders(client, params.symbol, params.status);
                break;
            case 'cancel':
                await cancelOrder(client, params.orderId);
                break;
            case 'transfer-in':
                await transferIn(client, params.symbol, params.amount);
                break;
            case 'transfer-out':
                await transferOut(client, params.symbol, params.amount);
                break;
            default:
                console.error(`未知命令: ${command}`);
                console.log('运行 "node isolated.js help" 查看帮助');
        }
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

async function getIsolatedMarginInfo(client, currency, symbol) {
    console.log('\n📈 **查询逐仓杠杆账户信息 (Isolated Margin)**\n');

    try {
        const result = await client.getIsolatedMarginAccount(symbol);
        if (result.error) {
            console.log('  暂未开通逐仓杠杆账户');
            return;
        }

        if (!result.assets || !Array.isArray(result.assets) || result.assets.length === 0) {
            console.log('  暂无资产');
            return;
        }

        let assets = result.assets;

        if (symbol) {
            assets = assets.filter(a => a.symbol.toUpperCase() === symbol.toUpperCase());
        }
        if (currency) {
            assets = assets.filter(a => 
                a.baseAsset.currency.toUpperCase() === currency.toUpperCase() || 
                a.quoteAsset.currency.toUpperCase() === currency.toUpperCase()
            );
        }

        console.log(`  总资产(折合): ${parseFloat(result.totalAssetOfQuoteCurrency || 0).toFixed(2)} USDT`);
        console.log(`  总负债: ${parseFloat(result.totalLiabilityOfQuoteCurrency || 0).toFixed(6)} USDT`);

        const activeAssets = assets.filter(a => 
            parseFloat(a.baseAsset.total) > 0 || 
            parseFloat(a.quoteAsset.total) > 0 || 
            parseFloat(a.baseAsset.liability) > 0 || 
            parseFloat(a.quoteAsset.liability) > 0
        );

        if (activeAssets.length === 0) {
            console.log('  暂无资产');
            return;
        }

        console.log(`\n  有资产的仓位 (${activeAssets.length} 个):\n`);
        activeAssets.forEach(asset => {
            console.log(`  ${asset.symbol} [${asset.status}]`);
            
            const base = asset.baseAsset;
            const quote = asset.quoteAsset;
            
            console.log(`    基础币 ${base.currency}:`);
            console.log(`      总额: ${parseFloat(base.total).toFixed(8)}`);
            console.log(`      可用: ${parseFloat(base.available).toFixed(8)}`);
            console.log(`      冻结: ${parseFloat(base.hold).toFixed(8)}`);
            console.log(`      负债: ${parseFloat(base.liability).toFixed(8)}`);
            console.log(`      最大可借: ${parseFloat(base.maxBorrowSize).toFixed(8)}`);
            
            console.log(`    计价币 ${quote.currency}:`);
            console.log(`      总额: ${parseFloat(quote.total).toFixed(8)}`);
            console.log(`      可用: ${parseFloat(quote.available).toFixed(8)}`);
            console.log(`      冻结: ${parseFloat(quote.hold).toFixed(8)}`);
            console.log(`      负债: ${parseFloat(quote.liability).toFixed(8)}`);
            console.log(`      最大可借: ${parseFloat(quote.maxBorrowSize).toFixed(8)}`);
            
            if (parseFloat(asset.debtRatio) > 0) {
                console.log(`    负债率: ${(parseFloat(asset.debtRatio) * 100).toFixed(2)}%`);
            }
            console.log('');
        });

    } catch (e) {
        console.log('  暂未开通逐仓杠杆账户');
    }
}

async function enableIsolatedMargin(client) {
    console.log('\n📈 **启用逐仓杠杆账户**\n');
    const result = await client.enableMarginAccount();
    if (result.error) {
        console.error('❌ 启用失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 启用成功');
}

async function disableIsolatedMargin(client) {
    console.log('\n📈 **禁用逐仓杠杆账户**\n');
    const result = await client.disableMarginAccount();
    if (result.error) {
        console.error('❌ 禁用失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 禁用成功');
}

async function getIsolatedConfig(client) {
    console.log('\n📈 **查询逐仓杠杆配置**\n');
    const result = await client.getMarginConfig();
    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }
    console.log('  支持币种数:', result.currencyList?.length || 0);
    console.log('  最大杠杆:', `${result.maxLeverage}x`);
    console.log('  警告负债率:', `${parseFloat(result.warningDebtRatio) * 100}%`);
    console.log('  强平负债率:', `${parseFloat(result.liqDebtRatio) * 100}%`);
}

async function getBorrowable(client, symbol) {
    if (!symbol) {
        console.error('❌ 请指定交易对: --symbol BTC-USDT');
        process.exit(1);
    }
    console.log(`\n📈 **查询 ${symbol} 可借额度**\n`);
    const currency = symbol.split('-')[0];
    const result = await client.getBorrowable(currency);
    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }
    console.log(`  币种: ${currency}`);
    console.log(`  最大可借: ${parseFloat(result.borrowable).toFixed(8)}`);
    console.log(`  最小可借: ${parseFloat(result.minBorrow).toFixed(8)}`);
    console.log(`  最小还款: ${parseFloat(result.minRepay).toFixed(8)}`);
}

async function borrow(client, symbol, amount) {
    if (!symbol || !amount) {
        console.error('❌ 请指定交易对和数量: --symbol BTC-USDT --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **逐仓借币 ${symbol}**\n`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${amount}\n`);

    const currency = symbol.split('-')[0];
    const result = await client.isolatedBorrow({
        currency: currency,
        size: amount,
        symbol: symbol,
        isIsolated: true,
        timeInForce: 'FOK'
    });

    if (result.error) {
        console.error('❌ 借币失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 借币成功');
    console.log(`  订单ID: ${result.orderId}`);
    console.log(`  数量: ${result.amount}`);
}

async function repay(client, symbol, amount) {
    if (!symbol || !amount) {
        console.error('❌ 请指定交易对和数量: --symbol BTC-USDT --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **逐仓还币 ${symbol}**\n`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${amount}\n`);

    const currency = symbol.split('-')[0];
    const result = await client.isolatedRepay({
        currency: currency,
        size: amount,
        symbol: symbol
    });

    if (result.error) {
        console.error('❌ 还币失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 还币成功');
    console.log(`  订单ID: ${result.orderId}`);
}

async function isolatedTrade(client) {
    const symbol = params.symbol || params['symbol'];
    const side = params.side || params['side'];
    const size = params.size || params['size'];
    const type = params.type || params['type'] || 'market';
    const price = params.price;
    const leverage = params.leverage || params.l;

    if (!symbol || !side || !size) {
        console.error('❌ 请指定交易参数: --symbol BTC-USDT --side buy --size 0.01 [--type market] [--price 50000] [--leverage 5]');
        process.exit(1);
    }

    console.log(`\n📈 **逐仓杠杆交易 ${symbol}**\n`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  方向: ${side === 'buy' ? '买入' : '卖出'}`);
    console.log(`  数量: ${size}`);
    console.log(`  类型: ${type}`);
    if (leverage) {
        console.log(`  杠杆: ${leverage}x\n`);
    } else {
        console.log('');
    }

    if (leverage) {
        const leverageResult = await client.setMarginLeverage(leverage);
        if (leverageResult.error) {
            console.error('❌ 设置杠杆失败:', leverageResult.error);
            process.exit(1);
        }
        console.log(`  ✅ 杠杆设置成功\n`);
    }

    const orderParams = {
        symbol: symbol,
        side: side,
        type: type,
        clientOid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isIsolated: true,
        autoBorrow: true
    };

    if (type === 'limit' && price) {
        orderParams.price = price;
        orderParams.size = size;
    } else {
        if (side === 'buy') {
            orderParams.funds = size;
        } else {
            orderParams.size = size;
        }
    }

    const result = await client.marginOrder(orderParams);

    if (result.error) {
        console.error('❌ 下单失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 下单成功');
    console.log(`  订单ID: ${result.orderId || result.id}`);
    console.log(`  Client OID: ${orderParams.clientOid}`);
}

async function getOrders(client, symbol, status) {
    console.log(`\n📈 **查询逐仓杠杆订单**\n`);

    const queryParams = {
        marginModel: 'isolated'
    };
    if (symbol) queryParams.symbol = symbol;
    if (status) queryParams.status = status;

    const result = await client.getMarginOrders(queryParams);

    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }

    if (!result || result.length === 0) {
        console.log('  暂无订单');
        return;
    }

    console.log(`  订单列表 (${result.length} 个):\n`);
    result.slice(0, 20).forEach(order => {
        console.log(`  ${order.orderId}:`);
        console.log(`    交易对: ${order.symbol}`);
        console.log(`    方向: ${order.side}`);
        console.log(`    数量: ${order.size}`);
        console.log(`    价格: ${order.price || '市价'}`);
        console.log(`    状态: ${order.status}`);
        console.log('');
    });
}

async function cancelOrder(client, orderId) {
    if (!orderId) {
        console.error('❌ 请指定订单ID: --orderId xxx');
        process.exit(1);
    }
    console.log(`\n📈 **取消逐仓杠杆订单**\n`);
    console.log(`  订单ID: ${orderId}\n`);

    const result = await client.cancelMarginOrder(orderId);

    if (result.error) {
        console.error('❌ 取消失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 取消成功');
}

async function transferIn(client, symbol, amount) {
    if (!symbol || !amount) {
        console.error('❌ 请指定交易对和数量: --symbol BTC-USDT --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **划入逐仓杠杆**\n`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${amount}\n`);

    const currency = symbol.split('-')[0];
    const clientOid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await client.universalTransfer({
        clientOid: clientOid,
        type: 'INTERNAL',
        currency: currency,
        amount: amount,
        fromAccountType: 'TRADE',
        toAccountType: 'ISOLATED'
    });

    if (result.error) {
        console.error('❌ 划转失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 划转成功');
    console.log(`  转账ID: ${result.orderId}`);
}

async function transferOut(client, symbol, amount) {
    if (!symbol || !amount) {
        console.error('❌ 请指定交易对和数量: --symbol BTC-USDT --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **划出逐仓杠杆**\n`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  数量: ${amount}\n`);

    const currency = symbol.split('-')[0];
    const clientOid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await client.universalTransfer({
        clientOid: clientOid,
        type: 'INTERNAL',
        currency: currency,
        amount: amount,
        fromAccountType: 'ISOLATED',
        toAccountType: 'TRADE'
    });

    if (result.error) {
        console.error('❌ 划转失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 划转成功');
    console.log(`  转账ID: ${result.orderId}`);
}

runIsolatedCommand();
