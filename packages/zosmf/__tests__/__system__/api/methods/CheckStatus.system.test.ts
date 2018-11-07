/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { CheckStatus, ZosmfMessages } from "../../../../../zosmf";
import { ConsoleValidator } from "../../../../../zosconsole";
import { Session, Imperative } from "@brightside/imperative";
import { inspect } from "util";
import { ITestEnvironment } from "../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { TestEnvironment } from "../../../../../../__tests__/__src__/environment/TestEnvironment";

let REAL_SESSION: Session;
let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let defaultSystem: ITestSystemSchema;

describe("Check Status Api", () => {
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "get_zosmf_info"
        });
        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        defaultSystem = systemProps.getDefaultSystem();

        REAL_SESSION = TestEnvironment.createZosmfSession(testEnvironment);
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("Success scenarios", () => {
        it("should return with expected information", async () => {
            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(REAL_SESSION);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeFalsy();
            expect(response).toBeTruthy();
            expect(JSON.stringify(response)).toContain("zosmf_version");
        });
    });

    describe("Failure scenarios", () => {
        it("should return with proper message for invalid session", async () => {
            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(undefined);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(ZosmfMessages.missingSession.message);
        });

        it("should return with proper message for invalid hostname", async () => {
            const badHostName = "badHost";
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: badHostName,
                port: defaultSystem.zosmf.port,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
            });

            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(`Error: getaddrinfo ENOTFOUND ${badHostName}`);
        });

        it("should return with proper message for invalid port", async () => {
            const badPort = 9999;
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: defaultSystem.zosmf.host,
                port: badPort,
                type: "basic",
                rejectUnauthorized: defaultSystem.zosmf.rejectUnauthorized,
            });

            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain(`Error: connect ECONNREFUSED`);
            expect(error.message).toContain(badPort);
        });

        it("should return with proper message for rejectUnauthorized = true", async () => {
            const badSession = new Session({
                user: defaultSystem.zosmf.user,
                password: defaultSystem.zosmf.pass,
                hostname: defaultSystem.zosmf.host,
                port: defaultSystem.zosmf.port,
                type: "basic",
                rejectUnauthorized: true,
            });

            let error;
            let response;

            try {
                response = await CheckStatus.getZosmfInfo(badSession);
            } catch (err) {
                error = err;
                Imperative.console.info("Error: " + inspect(error));
            }

            expect(error).toBeTruthy();
            expect(response).toBeFalsy();
            expect(error.message).toContain("Error: self signed certificate in certificate chain");
        });
    });
});
