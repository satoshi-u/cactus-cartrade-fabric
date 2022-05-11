#!/usr/bin/env bash
# Copyright 2020-2021 Hyperledger Cactus Contributors
# SPDX-License-Identifier: Apache-2.0

curl localhost:5034/api/v1/bl/trades/ -XPOST -H "Content-Type: application/json" -d '{"businessLogicID":"guks32pf","tradeParams":["Brad", "Cathy", "CAR1"],"authParams":["none"]}'

