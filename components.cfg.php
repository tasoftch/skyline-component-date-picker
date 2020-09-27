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

$dateJS = __DIR__ . "/dist/skyline-date-picker.min.js";
$dateCSS = __DIR__ . "/dist/skyline-date-picker.css";

$timeJS = __DIR__ . "/dist/skyline-time-picker.min.js";
$timeCSS = __DIR__ . "/dist/skyline-time-picker.css";


return [
    'DatePicker' => [
		"js" => new JavaScriptComponent(
			"/Public/Skyline/date-picker.min.js",
			'sha384-'.hash_file("sha384", $dateJS),
			NULL,
			CompilerContext::getCurrentCompiler()->getRelativeProjectPath($dateJS)
		),
		'css' => new CSSComponent(
			"/Public/Skyline/date-picker.min.css",
			'all',
			'sha384-'.hash_file("sha384", $dateCSS),
			NULL,
			CompilerContext::getCurrentCompiler()->getRelativeProjectPath($dateCSS)
		),
		AbstractComponent::COMP_REQUIREMENTS => [
			"Skyline"
		]
    ],
	'TimePicker' => [
		"js" => new JavaScriptComponent(
			"/Public/Skyline/time-picker.min.js",
			'sha384-'.hash_file("sha384", $timeJS),
			NULL,
			CompilerContext::getCurrentCompiler()->getRelativeProjectPath($timeJS)
		),
		'css' => new CSSComponent(
			"/Public/Skyline/time-picker.min.css",
			'all',
			'sha384-'.hash_file("sha384", $timeCSS),
			NULL,
			CompilerContext::getCurrentCompiler()->getRelativeProjectPath($timeCSS)
		),
		AbstractComponent::COMP_REQUIREMENTS => [
			"Skyline"
		]
	]
];