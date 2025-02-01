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
  name: "Can submit and retrieve weather data",
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
