# Rust API for openapi_client

Contains/describes the Keychain API types/paths for Hyperledger Cactus.

## Overview

This client/server was generated by the [openapi-generator]
(https://openapi-generator.tech) project.  By using the
[OpenAPI-Spec](https://github.com/OAI/OpenAPI-Specification) from a remote
server, you can easily generate a server stub.

To see how to make this your own, look here:

[README]((https://openapi-generator.tech))

- API version: 0.3.0
- Build date: 2021-10-04T20:30:49.096004-07:00[America/Los_Angeles]



This autogenerated project defines an API crate `openapi_client` which contains:
* An `Api` trait defining the API in Rust.
* Data types representing the underlying data model.
* A `Client` type which implements `Api` and issues HTTP requests for each operation.
* A router which accepts HTTP requests and invokes the appropriate `Api` method for each operation.

It also contains an example server and client which make use of `openapi_client`:

* The example server starts up a web server using the `openapi_client`
    router, and supplies a trivial implementation of `Api` which returns failure
    for every operation.
* The example client provides a CLI which lets you invoke
    any single operation on the `openapi_client` client by passing appropriate
    arguments on the command line.

You can use the example server and client as a basis for your own code.
See below for [more detail on implementing a server](#writing-a-server).

## Examples

Run examples with:

```
cargo run --example <example-name>
```

To pass in arguments to the examples, put them after `--`, for example:

```
cargo run --example client -- --help
```

### Running the example server
To run the server, follow these simple steps:

```
cargo run --example server
```

### Running the example client
To run a client, follow one of the following simple steps:

```
cargo run --example client DeleteKeychainEntryV1
cargo run --example client GetPrometheusMetricsV1
cargo run --example client HasKeychainEntryV1
```

### HTTPS
The examples can be run in HTTPS mode by passing in the flag `--https`, for example:

```
cargo run --example server -- --https
```

This will use the keys/certificates from the examples directory. Note that the
server chain is signed with `CN=localhost`.

## Using the generated library

The generated library has a few optional features that can be activated through Cargo.

* `server`
    * This defaults to enabled and creates the basic skeleton of a server implementation based on hyper
    * To create the server stack you'll need to provide an implementation of the API trait to provide the server function.
* `client`
    * This defaults to enabled and creates the basic skeleton of a client implementation based on hyper
    * The constructed client implements the API trait by making remote API call.
* `conversions`
    * This defaults to disabled and creates extra derives on models to allow "transmogrification" between objects of structurally similar types.

See https://doc.rust-lang.org/cargo/reference/manifest.html#the-features-section for how to use features in your `Cargo.toml`.

## Documentation for API Endpoints

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteKeychainEntryV1**](docs/default_api.md#deleteKeychainEntryV1) | **POST** /api/v1/plugins/@hyperledger/cactus-plugin-keychain-vault/delete-keychain-entry | Deletes an entry from the keychain stored under the provided key.
[**getKeychainEntryV1**](docs/default_api.md#getKeychainEntryV1) | **POST** /api/v1/plugins/@hyperledger/cactus-plugin-keychain-vault/get-keychain-entry | Retrieves the contents of a keychain entry from the backend.
[**getPrometheusMetricsV1**](docs/default_api.md#getPrometheusMetricsV1) | **GET** /api/v1/plugins/@hyperledger/cactus-plugin-keychain-vault/get-prometheus-exporter-metrics | Get the Prometheus Metrics
[**hasKeychainEntryV1**](docs/default_api.md#hasKeychainEntryV1) | **POST** /api/v1/plugins/@hyperledger/cactus-plugin-keychain-vault/has-keychain-entry | Retrieves the information regarding a key being present on the keychain or not.
[**setKeychainEntryV1**](docs/default_api.md#setKeychainEntryV1) | **POST** /api/v1/plugins/@hyperledger/cactus-plugin-keychain-vault/set-keychain-entry | Sets a value under a key on the keychain backend.


## Documentation For Models

 - [DeleteKeychainEntryRequestV1](docs/DeleteKeychainEntryRequestV1.md)
 - [DeleteKeychainEntryResponseV1](docs/DeleteKeychainEntryResponseV1.md)
 - [GetKeychainEntryRequest](docs/GetKeychainEntryRequest.md)
 - [GetKeychainEntryResponse](docs/GetKeychainEntryResponse.md)
 - [HasKeychainEntryRequestV1](docs/HasKeychainEntryRequestV1.md)
 - [HasKeychainEntryResponseV1](docs/HasKeychainEntryResponseV1.md)
 - [PrometheusExporterMetricsResponse](docs/PrometheusExporterMetricsResponse.md)
 - [SetKeychainEntryRequest](docs/SetKeychainEntryRequest.md)
 - [SetKeychainEntryResponse](docs/SetKeychainEntryResponse.md)


## Documentation For Authorization
 Endpoints do not require authorization.


## Author



