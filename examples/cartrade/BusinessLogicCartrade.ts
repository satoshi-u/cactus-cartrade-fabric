/* eslint-disable prettier/prettier */
/*
 * Copyright 2020-2021 Hyperledger Cactus Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * BusinessLogicCartrade.ts
 */

import { Request } from "express";
import { RequestInfo } from "@hyperledger/cactus-cmd-socket-server";
import { TradeInfo } from "@hyperledger/cactus-cmd-socket-server";
import { TransactionInfoManagement } from "./TransactionInfoManagement";
import { TransactionInfo } from "./TransactionInfo";
import { TransactionData } from "./TransactionData";
import { TxInfoData } from "./TxInfoData";
import { routesTransactionManagement } from "@hyperledger/cactus-cmd-socket-server";
import { routesVerifierFactory } from "@hyperledger/cactus-cmd-socket-server";
import { BusinessLogicBase } from "@hyperledger/cactus-cmd-socket-server";
import { makeSignedProposal } from "./TransactionFabric";
import { LedgerEvent } from "@hyperledger/cactus-cmd-socket-server";
import { json2str } from "@hyperledger/cactus-cmd-socket-server";
import { CartradeStatus } from "./define";
import { BusinessLogicInquireCartradeStatus } from "./BusinessLogicInquireCartradeStatus";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
//const config: any = JSON.parse(fs.readFileSync("/etc/cactus/default.json", 'utf8'));
const config: any = yaml.safeLoad(
  fs.readFileSync("/etc/cactus/default.yaml", "utf8"),
);
import { getLogger } from "log4js";
const moduleName = "BusinessLogicCartrade";
const logger = getLogger(`${moduleName}`);
logger.level = config.logLevel;

export class BusinessLogicCartrade extends BusinessLogicBase {
  transactionInfoManagement: TransactionInfoManagement;
  // useValidator: {};

  constructor() {
    super();
    this.transactionInfoManagement = new TransactionInfoManagement();
  }

  startTransaction(
    req: Request,
    businessLogicID: string,
    tradeID: string,
  ): void {
    logger.debug("called startTransaction");

    // set RequestInfo
    const requestInfo: RequestInfo = new RequestInfo();
    requestInfo.businessLogicID = businessLogicID;
    requestInfo.tradeInfo.fabricAccountFrom = req.body.tradeParams[0];
    requestInfo.tradeInfo.fabricAccountTo = req.body.tradeParams[1];
    requestInfo.tradeInfo.carID = req.body.tradeParams[2];
    // requestInfo.authInfo.company = req.body.authParams[0];

    // set TradeID
    requestInfo.setTradeID(tradeID);

    // Register transaction information in transaction information management
    const transactionInfo: TransactionInfo = new TransactionInfo();
    transactionInfo.setRequestInfo(0, requestInfo);
    this.transactionInfoManagement.addTransactionInfo(transactionInfo);

    // Create trade information
    const tradeInfo: TradeInfo = new TradeInfo(
      requestInfo.businessLogicID,
      requestInfo.tradeID,
    );

    // trade status update
    this.transactionInfoManagement.setStatus(
      tradeInfo,
      CartradeStatus.UnderTransfer,
    );

    // Get varidator information
    // this.useValidator = JSON.parse(routesTransactionManagement.getValidatorToUse(requestInfo.businessLogicID));

    // this.dummyTransaction(requestInfo, tradeInfo);
    this.simpleFabricTransaction(requestInfo, tradeInfo);
  }

  simpleFabricTransaction(
    requestInfo: RequestInfo,
    tradeInfo: TradeInfo,
  ): void {
    logger.debug("called simpleFabricTransaction");

    // Get Verifier Instance
    logger.debug(
      `##simpleFabricTransaction(): businessLogicID: ${tradeInfo.businessLogicID}`,
    );
    const useValidator = JSON.parse(
      routesTransactionManagement.getValidatorToUse(tradeInfo.businessLogicID),
    );
    //        const verifierFabric = routesTransactionManagement.getVerifier(useValidator['validatorID'][1]);
    const verifierFabric = routesVerifierFactory.getVerifier(
      useValidator["validatorID"][0],
      "BusinessLogicCartrade",
    );
    logger.debug("getVerifierFabric");

    // Generate parameters for sendSignedProposal(changeCarOwner)
    const ccFncName = "changeCarOwner";

    const ccArgs: string[] = [
      requestInfo.tradeInfo.carID, // CarID
      requestInfo.tradeInfo.fabricAccountTo, // Owner
    ];
    makeSignedProposal(ccFncName, ccArgs, verifierFabric)
      .then((result) => {
        // logger.info(`##ret makeSignedProposal: result: ${JSON.stringify(result)}`);
        logger.info("simpleFabricTransaction txId : " + result.txId);

        // Register transaction data in DB
        const transactionData: TransactionData = new TransactionData(
          "transfer",
          "ledger002",
          result.txId,
        );
        this.transactionInfoManagement.setTransactionData(
          tradeInfo,
          transactionData,
        );

        // NOTE: Convert properties to binary.
        //       If you do not convert the following, you will get an error.
        result.data["signedCommitProposal"].signature = Buffer.from(
          result.data["signedCommitProposal"].signature,
        );
        result.data["signedCommitProposal"].proposal_bytes = Buffer.from(
          result.data["signedCommitProposal"].proposal_bytes,
        );

        // Set Parameter
        //logger.debug('secondTranssimpleFabricTransactionaction data : ' + JSON.stringify(result.data));
        const contract = { channelName: "mychannel" };
        const method = { type: "sendSignedTransaction" };
        const template = "default";
        const args = { args: [result.data] };

        // Run Verifier (Fabric)
        verifierFabric
          .sendAsyncRequest(contract, method, args)
          .then(() => {
            logger.debug(`##simpleFabricTransaction sendAsyncRequest finish`);
          })
          .catch((err) => {
            logger.error(err);
          });
      })
      .catch((err) => {
        logger.error(err);
      });
  }

  completedTransaction(tradeInfo: TradeInfo): void {
    logger.debug("called completedTransaction");

    logger.debug(
      `##completedTransaction(): businessLogicID: ${tradeInfo.businessLogicID}`,
    );
    const useValidator = JSON.parse(
      routesTransactionManagement.getValidatorToUse(tradeInfo.businessLogicID),
    );
    const validatorId = useValidator["validatorID"][0];
  }

  finish(): void {
    logger.debug("called finish");
  }

  onEvent(ledgerEvent: LedgerEvent, targetIndex: number): void {
    logger.debug(`##in BLP:onEvent()`);
    logger.debug(`##onEvent(): ${json2str(ledgerEvent)}`);

    switch (ledgerEvent.verifierId) {
      case config.cartradeInfo.fabric.validatorID:
        this.onEvenFabric(ledgerEvent.data, targetIndex);
        break;
      default:
        logger.error(
          `##onEvent(), invalid verifierId: ${ledgerEvent.verifierId}`,
        );
        return;
    }
  }

  onEvenFabric(event: object, targetIndex: number): void {
    logger.debug(`##in onEvenFabric()`);
    const tx = this.getTransactionFromFabricEvent(event, targetIndex);
    if (tx == null) {
      logger.warn(`##onEvenFabric(): invalid event: ${json2str(event)}`);
      return;
    }

    try {
      const txId = tx["txId"];
      const status = event["status"];
      logger.debug(`##txId = ${txId}`);
      logger.debug(`##status =${status}`);

      if (status !== 200) {
        logger.error(
          `##onEvenFabric(): error event, status: ${status}, txId: ${txId}`,
        );
        return;
      }

      // Perform the following transaction actions
      this.executeNextTransaction(tx, txId);
    } catch (err) {
      logger.error(
        `##onEvenFabric(): onEvent, err: ${err}, event: ${json2str(event)}`,
      );
    }
  }

  getTransactionFromFabricEvent(event: object, targetIndex): object | null {
    try {
      const retTransaction = event["blockData"][targetIndex];
      logger.debug(
        `##getTransactionFromFabricEvent(): retTransaction: ${retTransaction}`,
      );
      return retTransaction;
    } catch (err) {
      logger.error(
        `##getTransactionFromFabricEvent(): invalid even, err:${err}, event:${event}`,
      );
    }
  }

  executeNextTransaction(txInfo: object, txId: string): void {
    let transactionInfo: TransactionInfo = null;
    try {
      // Retrieve DB transaction information
      transactionInfo =
        this.transactionInfoManagement.getTransactionInfoByTxId(txId);
      if (transactionInfo != null) {
        logger.debug(
          `##onEvent(A), transactionInfo: ${json2str(transactionInfo)}`,
        );
      } else {
        logger.warn(`##onEvent(B), not found transactionInfo, txId: ${txId}`);
        return;
      }
      const txStatus = transactionInfo.status;
      const tradeInfo =
        this.createTradeInfoFromTransactionInfo(transactionInfo);
      let txInfoData: TxInfoData;
      switch (txStatus) {
        case CartradeStatus.UnderTransfer:
          // store transaction information in DB
          txInfoData = new TxInfoData("transfer", json2str(txInfo));
          this.transactionInfoManagement.setTxInfo(tradeInfo, txInfoData);

          // UnderTransfer -> completed
          // const tradeInfo = this.createTradeInfoFromTransactionInfo(transactionInfo);
          this.transactionInfoManagement.setStatus(
            tradeInfo,
            CartradeStatus.Completed,
          );
          logger.info(
            `##INFO: completed cartrade, businessLogicID: ${transactionInfo.businessLogicID}, tradeID: ${transactionInfo.tradeID}`,
          );
          this.completedTransaction(tradeInfo);
          break;
        case CartradeStatus.Completed:
          logger.warn(
            `##WARN: already completed, txinfo: ${json2str(transactionInfo)}`,
          );
          return;
        default:
          logger.error(`##ERR: bad txStatus: ${txStatus}`);
          return;
      }
    } catch (err) {
      logger.error(
        `##ERR: executeNextTransaction(), err: ${err}, tx: ${json2str(
          transactionInfo,
        )}`,
      );
    }
  }

  createTradeInfoFromTransactionInfo(txInfo: TransactionInfo): TradeInfo {
    try {
      return new TradeInfo(txInfo.businessLogicID, txInfo.tradeID);
    } catch (err) {
      logger.error(`##ERR: createTradeInfoFromTransactionInfo(), ${err}`);
      throw err;
    }
  }

  getOperationStatus(tradeID: string): object {
    logger.debug(`##in getOperationStatus()`);
    const businessLogicInquireCartradeStatus: BusinessLogicInquireCartradeStatus =
      new BusinessLogicInquireCartradeStatus();
    const transactionStatusData =
      businessLogicInquireCartradeStatus.getCartradeOperationStatus(tradeID);

    return transactionStatusData;
  }

  getTxIDFromEvent(
    ledgerEvent: LedgerEvent,
    targetIndex: number,
  ): string | null {
    logger.debug(`##in getTxIDFromEvent`);
    logger.debug(`##event: ${json2str(ledgerEvent)}`);

    switch (ledgerEvent.verifierId) {
      case config.cartradeInfo.fabric.validatorID:
        return this.getTxIDFromEventFabric(ledgerEvent.data, targetIndex);
      default:
        logger.error(
          `##getTxIDFromEvent(): invalid verifierId: ${ledgerEvent.verifierId}`,
        );
    }
    return null;
  }

  getTxIDFromEventFabric(event: object, targetIndex: number): string | null {
    logger.debug(`##in getTxIDFromEventFabric()`);
    const tx = this.getTransactionFromFabricEvent(event, targetIndex);
    if (tx == null) {
      logger.warn(`#getTxIDFromEventFabric(): skip(not found tx)`);
      return null;
    }

    try {
      const txId = tx["txId"];

      if (typeof txId !== "string") {
        logger.warn(
          `#getTxIDFromEventFabric(): skip(invalid block, not found txId.), event: ${json2str(
            event,
          )}`,
        );
        return null;
      }

      logger.debug(`###getTxIDFromEventFabric(): txId: ${txId}`);
      return txId;
    } catch (err) {
      logger.error(
        `##getTxIDFromEventFabric(): err: ${err}, event: ${json2str(event)}`,
      );
      return null;
    }
  }

  hasTxIDInTransactions(txID: string): boolean {
    logger.debug(`##in hasTxIDInTransactions(), txID: ${txID}`);
    const transactionInfo =
      this.transactionInfoManagement.getTransactionInfoByTxId(txID);
    logger.debug(`##hasTxIDInTransactions(), ret: ${transactionInfo !== null}`);
    return transactionInfo !== null;
  }

  getEventDataNum(ledgerEvent: LedgerEvent): number {
    logger.debug(
      `##in BLP:getEventDataNum(), ledgerEvent.verifierId: ${ledgerEvent.verifierId}`,
    );
    const event = ledgerEvent.data;
    let retEventNum = 0;

    try {
      switch (ledgerEvent.verifierId) {
        case config.cartradeInfo.fabric.validatorID:
          retEventNum = event["blockData"].length;
          break;
        default:
          logger.error(
            `##getEventDataNum(): invalid verifierId: ${ledgerEvent.verifierId}`,
          );
          break;
      }
      logger.debug(
        `##getEventDataNum(): retEventNum: ${retEventNum}, verifierId: ${ledgerEvent.verifierId}`,
      );
      return retEventNum;
    } catch (err) {
      logger.error(
        `##getEventDataNum(): invalid even, err: ${err}, event: ${event}`,
      );
      return 0;
    }
  }
}
