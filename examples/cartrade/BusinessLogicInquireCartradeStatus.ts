/*
 * Copyright 2020-2021 Hyperledger Cactus Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * BusinessLogicInquireCartradeStatus.ts
 */

import { TransactionInfo } from "./TransactionInfo";
import { TransactionStatus } from "./TransactionStatus";
import { ResultTransactionStatusData } from "./ResultTransactionStatusData";
import { BusinessLogicBase } from "@hyperledger/cactus-cmd-socket-server";
import fs = require("fs");

export class BusinessLogicInquireCartradeStatus extends BusinessLogicBase {
  fileName = "TransactionInfo.json";

  constructor() {
    super();
  }

  getCartradeOperationStatus(tradeID: string): object {
    // Existence check of table file
    try {
      fs.statSync(this.fileName);
    } catch (err) {
      throw err;
    }

    // Read table file
    const fileData: string = fs.readFileSync(this.fileName, "utf8");
    const transactionInfoTable: string[] = JSON.parse(fileData)
      .table as string[];

    // Create Response Information
    const resultTransactionStatusData: ResultTransactionStatusData =
      new ResultTransactionStatusData();
    for (const transactionInfoJson of transactionInfoTable) {
      const transactionInfo: TransactionInfo = JSON.parse(
        transactionInfoJson
      ) as TransactionInfo;

      // Determine if target record
      if (transactionInfo.tradeID === tradeID) {
        // Set information
        resultTransactionStatusData.stateInfo = transactionInfo.status;

        const transferTransactionStatus = new TransactionStatus();
        transferTransactionStatus.state = "transfer";
        transferTransactionStatus.ledger = transactionInfo.transferLedger;
        transferTransactionStatus.txID = transactionInfo.transferTxID;
        transferTransactionStatus.txInfo = JSON.parse(
          transactionInfo.transferTxInfo
        );
        resultTransactionStatusData.transactionStatus.push(
          transferTransactionStatus
        );

        break;
      }
    }

    // Reply acquired information
    return resultTransactionStatusData;
  }
}
