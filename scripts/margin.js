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
    'info': '查询杠杆账户信息',
    'config': '查询杠杆配置',
    'borrowable': '查询可借额度',
    'borrow': '借币',
    'repay': '还币',
    'trade': '杠杆交易下单',
    'orders': '查询杠杆订单',
    'cancel': '取消杠杆订单'
};

async function runMarginCommand() {
    const client = new KuCoinClient(getConfig());

    if (!command || command === 'help' || command === '--help') {
        console.log('\n📈 **KuCoin 杠杆交易命令帮助**\n');
        console.log('用法: node margin.js <命令> [参数]\n');
        console.log('可用命令:');
        for (const [cmd, desc] of Object.entries(COMMANDS)) {
            console.log(`  ${cmd.padEnd(12)} - ${desc}`);
        }
        console.log('\n示例:');
        console.log('  node margin.js info');
        console.log('  node margin.js borrowable --currency BTC');
        console.log('  node margin.js borrow --currency BTC --amount 0.1');
        console.log('  node margin.js repay --currency BTC --amount 0.1');
        console.log('  node margin.js trade --symbol BTC-USDT --side buy --size 0.01 [--leverage 5]');
        console.log('  node margin.js orders --symbol BTC-USDT');
        console.log('\n资金划转请使用: node transfer.js');
        return;
    }

    try {
        switch (command) {
            case 'info':
                await getMarginInfo(client, params.currency);
                break;
            case 'config':
                await getMarginConfig(client);
                break;
            case 'borrowable':
                await getBorrowable(client, params.currency);
                break;
            case 'borrow':
                await borrow(client, params.currency, params.amount);
                break;
            case 'repay':
                await repay(client, params.currency, params.amount);
                break;
            case 'trade':
                await marginTrade(client);
                break;
            case 'orders':
                await getOrders(client, params.symbol, params.status);
                break;
            case 'cancel':
                await cancelOrder(client, params.orderId);
                break;
            default:
                console.error(`未知命令: ${command}`);
                console.log('运行 "node margin.js help" 查看帮助');
        }
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

async function getMarginInfo(client, currency) {
    console.log('\n📈 **查询全仓杠杆账户信息 (Cross Margin)**\n');
    
    const result = await client.getMarginAccount();
    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }
    
    if (!result.accounts || !Array.isArray(result.accounts)) {
        console.log('  暂未开通全仓杠杆账户');
        return;
    }

    let accounts = result.accounts;
    if (currency) {
        accounts = accounts.filter(acc => acc.currency.toUpperCase() === currency.toUpperCase());
    }

    console.log(`  总资产(折合): ${parseFloat(result.totalAssetOfQuoteCurrency || 0).toFixed(2)} USDT`);
    console.log(`  总负债: ${parseFloat(result.totalLiabilityOfQuoteCurrency || 0).toFixed(2)} USDT`);
    console.log(`  负债率: ${parseFloat(result.debtRatio || 0) * 100}%`);

    const activeAccounts = accounts.filter(acc => parseFloat(acc.total) > 0 || parseFloat(acc.liability) > 0);
    if (activeAccounts.length === 0) {
        console.log('  暂无资产');
        return;
    }

    console.log(`\n  有资产的币种 (${activeAccounts.length} 个):\n`);
    activeAccounts.forEach(acc => {
        console.log(`  ${acc.currency}:`);
        console.log(`    总额: ${parseFloat(acc.total).toFixed(8)}`);
        console.log(`    可用: ${parseFloat(acc.available).toFixed(8)}`);
        console.log(`    冻结: ${parseFloat(acc.hold).toFixed(8)}`);
        console.log(`    负债: ${parseFloat(acc.liability).toFixed(8)}`);
        console.log(`    最大可借: ${parseFloat(acc.maxBorrowSize).toFixed(8)}`);
    });
}

async function getMarginConfig(client) {
    console.log('\n📈 **查询杠杆配置**\n');
    const result = await client.getMarginConfig();
    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }
    console.log('  支持币种数:', result.currencyList?.length || 0);
    console.log('  最大杠杆:', `${result.maxLeverage}x`);
    console.log('  警告负债率:', `${parseFloat(result.warningDebtRatio) * 100}%`);
    console.log('  强平负债率:', `${parseFloat(result.liqDebtRatio) * 100}%`);
    if (result.currencyList && result.currencyList.length > 0) {
        console.log('\n  支持的币种:', result.currencyList.slice(0, 10).join(', ') + (result.currencyList.length > 10 ? '...' : ''));
    }
}

async function getBorrowable(client, currency) {
    if (!currency) {
        console.error('❌ 请指定币种: --currency BTC');
        process.exit(1);
    }
    console.log(`\n📈 **查询 ${currency} 可借额度**\n`);
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

async function borrow(client, currency, amount) {
    if (!currency || !amount) {
        console.error('❌ 请指定币种和数量: --currency BTC --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **借币 ${currency}**\n`);
    console.log(`  币种: ${currency}`);
    console.log(`  数量: ${amount}\n`);

    const result = await client.borrow({
        currency: currency,
        size: amount,
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

async function repay(client, currency, amount) {
    if (!currency || !amount) {
        console.error('❌ 请指定币种和数量: --currency BTC --amount 0.1');
        process.exit(1);
    }
    console.log(`\n📈 **还币 ${currency}**\n`);
    console.log(`  币种: ${currency}`);
    console.log(`  数量: ${amount}\n`);

    const result = await client.repay({
        currency: currency,
        size: amount
    });

    if (result.error) {
        console.error('❌ 还币失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 还币成功');
    console.log(`  订单ID: ${result.orderId}`);
    console.log(`  已还数量: ${result.amount}`);
}

async function marginTrade(client) {
    const symbol = params.symbol || params.s || 'BTC-USDT';
    const side = params.side || params.sd || 'buy';
    const size = params.size || params.q || params.amount;
    const price = params.price || params.p;
    const leverage = params.leverage || params.l;
    const type = price ? 'limit' : 'market';

    if (!size) {
        console.error('❌ 请指定数量: --size 0.01 或 --amount 0.01');
        process.exit(1);
    }

    console.log(`\n📈 **杠杆交易下单**`);
    console.log(`  交易对: ${symbol}`);
    console.log(`  方向: ${side === 'buy' ? '买入(做多)' : '卖出(做空)'}`);
    console.log(`  类型: ${type}`);
    console.log(`  数量: ${size}`);
    if (price) {
        console.log(`  价格: ${price}`);
    }
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
        autoBorrow: true
    };

    if (price) {
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
    console.log(`  订单ID: ${result.orderId}`);
    console.log(`  Client OID: ${orderParams.clientOid}`);
}

async function getOrders(client, symbol, status) {
    console.log(`\n📈 **查询杠杆订单**\n`);

    const queryParams = {};
    if (symbol) queryParams.symbol = symbol;
    if (status) queryParams.status = status;

    const result = await client.getMarginOrders(queryParams);

    if (result.error) {
        console.error('❌ 查询失败:', result.error);
        process.exit(1);
    }

    const orders = result.data || result;
    if (!orders || orders.length === 0) {
        console.log('  暂无订单记录');
        return;
    }

    console.log(`共 ${orders.length} 个订单:\n`);
    orders.forEach(order => {
        console.log(`  订单ID: ${order.id}`);
        console.log(`    交易对: ${order.symbol}`);
        console.log(`    方向: ${order.side === 'buy' ? '买入' : '卖出'}`);
        console.log(`    类型: ${order.type}`);
        console.log(`    数量: ${order.size}`);
        console.log(`    价格: ${order.price || '市价'}`);
        console.log(`    状态: ${order.status}`);
        console.log(`    创建时间: ${new Date(order.createdAt).toLocaleString()}`);
        console.log('');
    });
}

async function cancelOrder(client, orderId) {
    if (!orderId) {
        console.error('❌ 请指定订单ID: --orderId xxx');
        process.exit(1);
    }
    console.log(`\n📈 **取消杠杆订单 ${orderId}**\n`);

    const result = await client.cancelMarginOrder(orderId);

    if (result.error) {
        console.error('❌ 取消失败:', result.error);
        process.exit(1);
    }
    console.log('✅ 订单已取消');
}

runMarginCommand();
