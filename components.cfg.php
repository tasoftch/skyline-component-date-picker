<?php
/**
 * Copyright (c) 2019 TASoft Applications, Th. Abplanalp <info@tasoft.ch>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

use Skyline\Compiler\CompilerContext;
use Skyline\Component\Config\AbstractComponent;
use Skyline\Component\Config\CSSComponent;
use Skyline\Component\Config\JavaScriptComponent;
use Skyline\Component\Config\JavaScriptPostLoadComponent;

$dateJS = __DIR__ . "/dist/skyline-date-picker.min.js";
$dateCSS = __DIR__ . "/dist/skyline-date-picker.css";

$timeJS = __DIR__ . "/dist/skyline-time-picker.min.js";
$timeCSS = __DIR__ . "/dist/skyline-time-picker.css";

$localDE = __DIR__ . "/dist/i18n/skyline-date-picker-i18n-de.js";

return [
    'DatePicker' => [
		"js" => new JavaScriptPostLoadComponent(
			...AbstractComponent::makeLocalFileComponentArguments(
			"/Public/Skyline/date-picker.min.js",
			$dateJS,
			"sha384"
			)
		),
		'css' => new CSSComponent(
			...AbstractComponent::makeLocalFileComponentArguments(
			"/Public/Skyline/date-picker.min.css",
				$dateCSS,
				"sha384",
				NULL,
				'all'
			)
		),
		AbstractComponent::COMP_REQUIREMENTS => [
			"Skyline"
		]
    ],
	'TimePicker' => [
		"js" => new JavaScriptPostLoadComponent(
			...AbstractComponent::makeLocalFileComponentArguments(
			"/Public/Skyline/time-picker.min.js",
			$timeJS,
			"sha384"
		)
		),
		'css' => new CSSComponent(
			...AbstractComponent::makeLocalFileComponentArguments(
			"/Public/Skyline/time-picker.min.css",
			$timeCSS,
			"sha384",
			NULL,
			'all'
		)
		),
		AbstractComponent::COMP_REQUIREMENTS => [
			"Skyline"
		]
	],
	"DateTimeGerman" => [
		"js" => new JavaScriptComponent(
			...AbstractComponent::makeLocalFileComponentArguments(
			"/Public/Skyline/date-time-picker.de.min.js",
			$localDE,
			"sha384"
		)
		)
	]
];