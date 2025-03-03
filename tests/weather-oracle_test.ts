import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure only owner can add data providers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "weather-oracle",
        "add-provider",
        [types.principal(wallet1.address)],
        wallet1.address
      ),
    ]);
    
    block.receipts[0].result.expectErr(100);
  },
});

Clarinet.test({
  name: "Can submit and retrieve valid weather data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const provider = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "weather-oracle",
        "add-provider",
        [types.principal(provider.address)],
        deployer.address
      ),
      Tx.contractCall(
        "weather-oracle",
        "submit-weather-data",
        [
          types.ascii("New York"),
          types.int(25),
          types.uint(60),
          types.uint(5),
          types.uint(45)
        ],
        provider.address
      ),
    ]);
    
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    
    let response = chain.callReadOnlyFn(
      "weather-oracle",
      "get-weather-data",
      [types.ascii("New York")],
      deployer.address
    );
    
    response.result.expectOk();
  },
});

Clarinet.test({
  name: "Rejects invalid weather data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const provider = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "weather-oracle",
        "add-provider",
        [types.principal(provider.address)],
        deployer.address
      ),
      Tx.contractCall(
        "weather-oracle",
        "submit-weather-data",
        [
          types.ascii("New York"),
          types.int(100),  // Invalid temperature
          types.uint(150), // Invalid humidity
          types.uint(5),
          types.uint(45)
        ],
        provider.address
      ),
    ]);
    
    block.receipts[1].result.expectErr(103);
  },
});

Clarinet.test({
  name: "Enforces rate limiting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const provider = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "weather-oracle",
        "add-provider",
        [types.principal(provider.address)],
        deployer.address
      ),
      Tx.contractCall(
        "weather-oracle",
        "submit-weather-data",
        [
          types.ascii("New York"),
          types.int(25),
          types.uint(60),
          types.uint(5),
          types.uint(45)
        ],
        provider.address
      ),
      Tx.contractCall(
        "weather-oracle",
        "submit-weather-data",
        [
          types.ascii("New York"),
          types.int(26),
          types.uint(61),
          types.uint(6),
          types.uint(46)
        ],
        provider.address
      ),
    ]);
    
    block.receipts[2].result.expectErr(105);
  },
});

Clarinet.test({
  name: "Properly tracks provider reputation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const provider = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "weather-oracle",
        "add-provider",
        [types.principal(provider.address)],
        deployer.address
      ),
      Tx.contractCall(
        "weather-oracle",
        "submit-weather-data",
        [
          types.ascii("New York"),
          types.int(25),
          types.uint(60),
          types.uint(5),
          types.uint(45)
        ],
        provider.address
      ),
    ]);
    
    let response = chain.callReadOnlyFn(
      "weather-oracle",
      "get-provider-status",
      [types.principal(provider.address)],
      deployer.address
    );
    
    response.result.expectOk();
  },
});
