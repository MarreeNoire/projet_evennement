/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
// Les images intermédiaires restent en PNG : le grain et les dégradés du
// décor papier survivent mal à une compression JPEG.
Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(18);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
