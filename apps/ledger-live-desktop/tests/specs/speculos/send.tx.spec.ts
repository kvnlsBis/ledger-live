import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Fee } from "../../enum/Fee";
import { Transaction } from "../../models/Transaction";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const transactionsInputsInvalid = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2568",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM),
    expectedErrorMessage: null,
    xrayTicket: "B2CQA-2569",
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 10 XRP to activate it",
    xrayTicket: "B2CQA-2571",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_2, "1.2", Fee.MEDIUM),
    expectedErrorMessage: "Balance cannot be below 1 DOT. Send max to empty account.",
    xrayTicket: "B2CQA-2567",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
    xrayTicket: "B2CQA-2570",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM),
    expectedErrorMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-2572",
  },
];

const transactionE2E = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    xrayTicket: "B2CQA-2574",
  },
  {
    transaction: new Transaction(Account.DOGE_1, Account.DOGE_2, "0.01", Fee.SLOW),
    xrayTicket: "B2CQA-2573",
  },
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581 or insufficient funds

for (const transaction of transactionE2E) {
  test.describe("Send from 1 account to another", () => {
    test.use({
      userdata: "speculos-tests-app",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
    });

    test(
      `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName}`,
      {
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToDebit.accountName,
        );

        await app.account.clickSend();
        await app.send.fillTxInfo(transaction.transaction);
        await app.send.expectTxInfoValidity(transaction.transaction);
        await app.send.clickContinueToDevice();

        await app.speculos.expectValidTxInfo(transaction.transaction);
        await app.send.expectTxSent();
        await app.account.navigateToViewDetails();
        await app.drawer.addressValueIsVisible(transaction.transaction.accountToCredit.address);
        await app.drawer.close();

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToCredit.accountName,
        );
        await app.layout.syncAccounts();
        await app.account.clickOnLastOperation();
        await app.drawer.expectReceiverInfos(transaction.transaction);
      },
    );
  });
}

test.describe("Send token (subAccount) - invalid address input", () => {
  const tokenTransactionInvalid = {
    transaction: new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
  };

  test.use({
    userdata: "speculos-subAccount",
    speculosApp: tokenTransactionInvalid.transaction.accountToDebit.currency.speculosApp,
  });

  test(
    `Send from ${tokenTransactionInvalid.transaction.accountToDebit.accountName} to ${tokenTransactionInvalid.transaction.accountToCredit.accountName} - invalid address input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2702",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        tokenTransactionInvalid.transaction.accountToDebit.accountName,
      );
      await app.account.navigateToTokenInAccount(
        tokenTransactionInvalid.transaction.accountToDebit,
      );
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionInvalid.transaction.accountToCredit.address);
      await app.send.checkContinueButtonDisabled();
      await app.layout.checkErrorMessage(tokenTransactionInvalid.expectedErrorMessage);
    },
  );
});

test.describe("Send token (subAccount) - invalid amount input", () => {
  const tokenTransactionInvalid = [
    {
      transaction: new Transaction(Account.BSC_BUSD_1, Account.BSC_BUSD_2, "1", Fee.MEDIUM),
      expectedWarningMessage: new RegExp(
        /You need \d+\.\d+ BNB in your account to pay for transaction fees on the Binance Smart Chain network\. .*/,
      ),
      xrayTicket: "B2CQA-2700",
    },
    {
      transaction: new Transaction(Account.ETH_USDT_2, Account.ETH_USDT_1, "1", Fee.MEDIUM),
      expectedWarningMessage: new RegExp(
        /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
      ),
      xrayTicket: "B2CQA-2701",
    },
  ];
  for (const transaction of tokenTransactionInvalid) {
    test.use({
      userdata: "speculos-2ETH-2BNB",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
    });
    test(
      `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - invalid amount input`,
      {
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToDebit.accountName,
        );
        await app.account.navigateToTokenInAccount(transaction.transaction.accountToDebit);
        await app.account.clickSend();
        await app.send.fillRecipient(transaction.transaction.accountToCredit.address);
        await app.send.clickContinue();
        await app.send.fillAmount(transaction.transaction.amount);
        await app.send.checkContinueButtonDisabled();
        await app.layout.checkWarningMessage(transaction.expectedWarningMessage);
      },
    );
  }
});

test.describe("Send token (subAccount) - valid address & amount input", () => {
  const tokenTransactionValid = new Transaction(
    Account.ETH_USDT_1,
    Account.ETH_USDT_2,
    "1",
    Fee.MEDIUM,
  );
  test.use({
    userdata: "speculos-subAccount",
    speculosApp: tokenTransactionValid.accountToDebit.currency.speculosApp,
  });

  test(
    `Send from ${tokenTransactionValid.accountToDebit.accountName} to ${tokenTransactionValid.accountToCredit.accountName} - valid address & amount input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2703, B2CQA-475",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(tokenTransactionValid.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(tokenTransactionValid.accountToDebit);
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionValid.accountToCredit.address);
      await app.send.checkContinueButtonEnable();
      await app.layout.checkInputErrorNotVisible();
      await app.send.clickContinue();
      await app.send.fillAmount(tokenTransactionValid.amount);
      await app.send.checkContinueButtonEnable();
    },
  );
});

test.describe("Check invalid address input error", () => {
  const transactionInvalidAddress = new Transaction(
    Account.ETH_1,
    Account.BTC_NATIVE_SEGWIT_1,
    "0.00001",
    Fee.MEDIUM,
  );

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: transactionInvalidAddress.accountToDebit.currency.speculosApp,
  });

  test(
    `Check invalid address input error for ${transactionInvalidAddress.accountToDebit.currency.name}`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-1904",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        transactionInvalidAddress.accountToDebit.accountName,
      );

      await app.account.clickSend();
      await app.send.fillRecipient(transactionInvalidAddress.accountToCredit.address);
      await app.send.checkInvalidAddressError(transactionInvalidAddress);
    },
  );
});

for (const transaction of transactionsInputsInvalid) {
  test.describe("Check invalid amount input error", () => {
    test.use({
      userdata: "speculos-tests-app",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
    });

    test(
      `Check "${transaction.expectedErrorMessage}" for ${transaction.transaction.accountToDebit.currency.name} - invalid amount ${transaction.transaction.amount} input error`,
      {
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToDebit.accountName,
        );

        await app.account.clickSend();
        await app.send.fillRecipient(transaction.transaction.accountToCredit.address);
        await app.send.clickContinue();
        await app.send.fillAmount(transaction.transaction.amount);
        await app.send.checkContinueButtonDisabled();
        await app.layout.checkErrorMessage(transaction.expectedErrorMessage);
      },
    );
  });
}

test.describe("Verify send max user flow", () => {
  const transactionInputValid = new Transaction(
    Account.ETH_1,
    Account.ETH_2,
    "send max",
    Fee.MEDIUM,
  );

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: transactionInputValid.accountToDebit.currency.speculosApp,
  });

  test(
    `Check Valid amount input (${transactionInputValid.amount})`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-473",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transactionInputValid.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillRecipient(transactionInputValid.accountToCredit.address);
      await app.send.clickContinue();
      await app.send.fillAmount(transactionInputValid.amount);
      await app.send.checkContinueButtonEnable();
      await app.layout.checkInputErrorNotVisible();
    },
  );
});
