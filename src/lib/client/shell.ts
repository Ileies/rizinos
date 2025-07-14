/**
 * A mock function that parses bash input according to Linux shell rules
 * @param input The bash command string to parse
 * @returns A structured representation of the parsed command
 */

// Define types for our parser
type TokenType =
	'word' |
	'operator' |
	'redirection' |
	'background' |
	'variable' |
	'semicolon' |
	'subshell_start' |
	'subshell_end' |
	'command_substitution_start' |
	'command_substitution_end' |
	'brace_expansion' |
	'heredoc' |
	'herestring';

interface Token {
	type: TokenType;
	value: string;
	raw?: string; // Original text before processing
}

interface Variable {
	name: string;
	modifiers?: string; // For parameter expansion like ${var:-default}
}

interface Redirection {
	type: 'input' | 'output' | 'append' | 'error' | 'heredoc' | 'herestring';
	descriptor?: number;
	target: string;
	content?: string; // For heredocs and herestrings
}

interface Command {
	command: string;
	args: (string | Variable | CommandSubstitution | BraceExpansion)[];
	redirections: Redirection[];
	background: boolean;
	subshell: boolean;
}

interface Pipeline {
	commands: Command[];
	operator?: '&&' | '||' | ';';
}

interface CommandSubstitution {
	type: 'command_substitution';
	command: string;
}

interface BraceExpansion {
	type: 'brace_expansion';
	values: string[];
}

interface ParsedCommand {
	pipelines: Pipeline[];
}

// Tokenize the input according to bash rules
function tokenize(str: string): Token[] {
	const tokens: Token[] = [];
	let current = '';
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inVariableBrace = false;
	let inCommandSubstitution = false;
	let inProcessSubstitution = false;
	let inArithmeticExpansion = false;
	let subshellDepth = 0;
	let braceDepth = 0;
	let escaped = false;

	// Process variable references inside the current token
	function processVariables(token: string): Token {
		const variablePattern = /\$(\w+|\$|\?|#|@|\*|\d+|{[^}]+})/g;
		const processed = token;
		let match;
		const variableReferences: Variable[] = [];

		// Extract all variable references
		while ((match = variablePattern.exec(token)) !== null) {
			let varName = match[1];

			// Handle the ${VAR} format
			if (varName.startsWith('{') && varName.endsWith('}')) {
				varName = varName.slice(1, -1);

				// Check for parameter expansion
				const expansionMatch = /^(\w+)(:-|:=|:?|\+|#|##|%|%%|\/)/.exec(varName);
				if (expansionMatch) {
					variableReferences.push({
						name: expansionMatch[1],
						modifiers: expansionMatch[2] + varName.slice(expansionMatch[0].length)
					});
				} else {
					variableReferences.push({ name: varName });
				}
			} else {
				variableReferences.push({ name: varName });
			}
		}

		if (variableReferences.length > 0) {
			return { type: 'variable', value: processed, raw: token };
		}

		return { type: 'word', value: processed, raw: token };
	}

	for (let i = 0; i < str.length; i++) {
		const char = str[i];
		const nextChar = i + 1 < str.length ? str[i + 1] : '';

		// Handle escaping
		if (escaped) {
			current += char;
			escaped = false;
			continue;
		} else if (char === '\\') {
			escaped = true;
			continue;
		}

		// Handle quotes
		if (char === '\'' && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
			current += char;
			continue;
		}

		if (char === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
			current += char;
			continue;
		}

		// If we're in quotes, just add the character
		if (inSingleQuote || inDoubleQuote) {
			current += char;
			continue;
		}

		// Handle command substitution
		if (char === '$' && nextChar === '(') {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			tokens.push({ type: 'command_substitution_start', value: '$(' });
			inCommandSubstitution = true;
			i++; // Skip the next character
			continue;
		}

		// Handle variable with brace
		if (char === '$' && nextChar === '{') {
			current += char + nextChar;
			inVariableBrace = true;
			i++; // Skip the next character
			continue;
		}

		if (inVariableBrace && char === '}') {
			current += char;
			inVariableBrace = false;
			continue;
		}

		// Handle process substitution
		if ((char === '<' || char === '>') && nextChar === '(') {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			tokens.push({ type: 'word', value: char + '(', raw: char + '(' });
			inProcessSubstitution = true;
			i++; // Skip the next character
			continue;
		}

		// Handle arithmetic expansion
		if (char === '$' && nextChar === '(' && i + 2 < str.length && str[i + 2] === '(') {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			tokens.push({ type: 'word', value: '$((', raw: '$((' });
			inArithmeticExpansion = true;
			i += 2; // Skip the next two characters
			continue;
		}

		// Handle subshells
		if (char === '(' && !inCommandSubstitution && !inProcessSubstitution) {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			tokens.push({ type: 'subshell_start', value: '(' });
			subshellDepth++;
			continue;
		}

		if (char === ')') {
			if (inCommandSubstitution) {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'command_substitution_end', value: ')' });
				inCommandSubstitution = false;
				continue;
			} else if (inProcessSubstitution) {
				current += char;
				inProcessSubstitution = false;
				continue;
			} else if (inArithmeticExpansion && nextChar === ')') {
				current += char + nextChar;
				inArithmeticExpansion = false;
				i++; // Skip the next character
				continue;
			} else if (subshellDepth > 0) {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'subshell_end', value: ')' });
				subshellDepth--;
				continue;
			}
		}

		// Handle brace expansion
		if (char === '{' && !inVariableBrace) {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			current += char;
			braceDepth++;
			continue;
		}

		if (char === '}' && braceDepth > 0 && !inVariableBrace) {
			current += char;
			braceDepth--;
			if (braceDepth === 0) {
				// Check if this is a valid brace expansion
				const braceContent = current.slice(1, -1);
				if (braceContent.includes(',') || braceContent.includes('..')) {
					tokens.push({ type: 'brace_expansion', value: current, raw: current });
					current = '';
				} else {
					// Not a valid brace expansion, just a literal
					tokens.push({ type: 'word', value: current, raw: current });
					current = '';
				}
			}
			continue;
		}

		// Handle whitespace
		if ((char === ' ' || char === '\t') && !inVariableBrace && !inCommandSubstitution && braceDepth === 0) {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			continue;
		}

		// Handle comments
		if (char === '#' && !inVariableBrace && !inCommandSubstitution && braceDepth === 0) {
			if (current) {
				tokens.push(processVariables(current));
				current = '';
			}
			// Ignore the rest of the line
			break;
		}

		// Handle operators and special characters
		if (!inVariableBrace && !inCommandSubstitution && braceDepth === 0) {
			// Logical operators
			if (char === '|' && nextChar === '|') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'operator', value: '||' });
				i++;
				continue;
			}

			if (char === '&' && nextChar === '&') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'operator', value: '&&' });
				i++;
				continue;
			}

			// Pipe
			if (char === '|') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'operator', value: '|' });
				continue;
			}

			// Background execution
			if (char === '&') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'background', value: '&' });
				continue;
			}

			// Command separator
			if (char === ';') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'semicolon', value: ';' });
				continue;
			}

			// Redirections
			if (char === '<' && nextChar === '<' && i + 2 < str.length && str[i + 2] === '<') {
				// Here-string: <<<
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'herestring', value: '<<<' });
				i += 2;
				continue;
			} else if (char === '<' && nextChar === '<') {
				// Here-doc: <<
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'heredoc', value: '<<' });
				i++;
				continue;
			} else if (char === '<') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'redirection', value: '<' });
				continue;
			}

			if (char === '>' && nextChar === '>') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'redirection', value: '>>' });
				i++;
				continue;
			} else if (char === '>') {
				if (current) {
					tokens.push(processVariables(current));
					current = '';
				}
				tokens.push({ type: 'redirection', value: '>' });
				continue;
			}

			// File descriptor redirections
			if (/\d/.test(char) && (nextChar === '>' || (nextChar === '&' && i + 2 < str.length && str[i + 2] === '>'))) {
				const isAmpersand = nextChar === '&';
				const redirectChar = isAmpersand ? str[i + 2] : nextChar;
				const thirdChar = isAmpersand ? (i + 3 < str.length ? str[i + 3] : '') : (i + 2 < str.length ? str[i + 2] : '');

				if (redirectChar === '>' && thirdChar === '>') {
					// e.g. 2>>, 2&>>
					if (current) {
						tokens.push(processVariables(current));
						current = '';
					}
					tokens.push({ type: 'redirection', value: isAmpersand ? `${char}&>>` : `${char}>>` });
					i += isAmpersand ? 3 : 2;
					continue;
				} else if (redirectChar === '>') {
					// e.g. 2>, 2&>
					if (current) {
						tokens.push(processVariables(current));
						current = '';
					}
					tokens.push({ type: 'redirection', value: isAmpersand ? `${char}&>` : `${char}>` });
					i += isAmpersand ? 2 : 1;
					continue;
				}
			}
		}

		// Collect all other characters
		current += char;
	}

	// Add the last token if there is one
	if (current) {
		tokens.push(processVariables(current));
	}

	return tokens;
}

// Parse tokens into brace expansion
function parseBraceExpansion(token: Token): BraceExpansion {
	const braceContent = token.value.slice(1, -1);
	let values: string[] = [];

	if (braceContent.includes('..')) {
		// Range expansion
		const [start, end] = braceContent.split('..').map(s => parseInt(s.trim()));
		if (!isNaN(start) && !isNaN(end)) {
			const step = start <= end ? 1 : -1;
			for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
				values.push(i.toString());
			}
		}
	} else if (braceContent.includes(',')) {
		// List expansion
		values = braceContent.split(',').map(s => s.trim());
	}

	return { type: 'brace_expansion', values };
}

// Parse a command substitution
function parseCommandSubstitution(tokens: Token[], startIndex: number): [CommandSubstitution, number] {
	let endIndex = startIndex;
	let depth = 1;
	const substitutionTokens: Token[] = [];

	for (let i = startIndex + 1; i < tokens.length; i++) {
		if (tokens[i].type === 'command_substitution_start') {
			depth++;
		} else if (tokens[i].type === 'command_substitution_end') {
			depth--;
			if (depth === 0) {
				endIndex = i;
				break;
			}
		}
		substitutionTokens.push(tokens[i]);
	}

	const commandStr = substitutionTokens.map(t => t.raw ?? t.value).join(' ');

	return [{ type: 'command_substitution', command: commandStr }, endIndex];
}

// Parse a single command from tokens
function parseCommand(tokens: Token[]): Command {
	const command: Command = {
		command: '',
		args: [],
		redirections: [],
		background: false,
		subshell: false
	};

	// Check for background execution
	if (tokens.length > 0 && tokens[tokens.length - 1].type === 'background') {
		command.background = true;
		tokens = tokens.slice(0, -1);
	}

	// Process tokens
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		// Handle redirections
		if ((token.type === 'redirection' || token.type === 'heredoc' || token.type === 'herestring') &&
			i + 1 < tokens.length &&
			(tokens[i + 1].type === 'word' || tokens[i + 1].type === 'variable')) {

			const target = tokens[i + 1].value;
			const redirection: Redirection = { type: 'input', target };

			switch (token.value) {
				case '<':
					redirection.type = 'input';
					break;
				case '>':
					redirection.type = 'output';
					break;
				case '>>':
					redirection.type = 'append';
					break;
				case '<<':
					redirection.type = 'heredoc';
					// For heredocs, we should collect lines until we find the delimiter
					// but we'll simplify this for the mock
					redirection.content = 'heredoc content would be here';
					break;
				case '<<<':
					redirection.type = 'herestring';
					redirection.content = target;
					break;
				default:
					// Handle file descriptor redirections
					if (/^\d+>$/.test(token.value)) {
						redirection.type = 'output';
						redirection.descriptor = parseInt(token.value.slice(0, -1));
					} else if (/^\d+>>$/.test(token.value)) {
						redirection.type = 'append';
						redirection.descriptor = parseInt(token.value.slice(0, -2));
					} else if (/^\d+&>$/.test(token.value)) {
						redirection.type = 'output';
						redirection.descriptor = parseInt(token.value.slice(0, -2));
						// This would redirect both stdout and stderr
					}
					break;
			}

			command.redirections.push(redirection);
			i++; // Skip the target token
		}
		// Handle command substitution
		else if (token.type === 'command_substitution_start') {
			const [cmdSubst, endIndex] = parseCommandSubstitution(tokens, i);
			if (!command.command) {
				command.command = '$(...)'; // Simplified for mock
				command.args.push(cmdSubst);
			} else {
				command.args.push(cmdSubst);
			}
			i = endIndex; // Skip to the end of the substitution
		}
		// Handle brace expansion
		else if (token.type === 'brace_expansion') {
			const expansion = parseBraceExpansion(token);
			if (!command.command) {
				command.command = expansion.values[0] || '';
				if (expansion.values.length > 1) {
					command.args.push(expansion);
				}
			} else {
				command.args.push(expansion);
			}
		}
		// Handle variables
		else if (token.type === 'variable') {
			if (!command.command) {
				command.command = token.value;
			} else {
				command.args.push(token.value);
			}
		}
		// Handle words (command and args)
		else if (token.type === 'word') {
			if (!command.command) {
				command.command = token.value;
			} else {
				command.args.push(token.value);
			}
		}
		// Handle subshell start/end
		else if (token.type === 'subshell_start') {
			command.subshell = true;
		}
	}

	return command;
}

// Main parsing function
function parse(input: string): ParsedCommand {
	// Trim input
	const cleanedInput = input.trim();

	if (!cleanedInput) {
		return { pipelines: [] };
	}

	// Tokenize
	const tokens = tokenize(cleanedInput);

	// Split by semicolons first
	const semicolonBlocks: Token[][] = [];
	let currentBlock: Token[] = [];

	for (const token of tokens) {
		if (token.type === 'semicolon') {
			semicolonBlocks.push(currentBlock);
			currentBlock = [];
		} else {
			currentBlock.push(token);
		}
	}

	if (currentBlock.length > 0) {
		semicolonBlocks.push(currentBlock);
	}

	// Process each semicolon-separated block
	const pipelines: Pipeline[] = [];

	for (const block of semicolonBlocks) {
		// Process logical operators (&&, ||)
		const logicalBlocks: { tokens: Token[], operator?: '&&' | '||' }[] = [];
		let currentLogicalBlock: Token[] = [];

		for (const token of block) {
			if (token.type === 'operator' && (token.value === '&&' || token.value === '||')) {
				logicalBlocks.push({
					tokens: currentLogicalBlock,
					operator: token.value
				});
				currentLogicalBlock = [];
			} else {
				currentLogicalBlock.push(token);
			}
		}

		if (currentLogicalBlock.length > 0) {
			logicalBlocks.push({ tokens: currentLogicalBlock });
		}

		// Process each logical block into pipelines
		for (const logicalBlock of logicalBlocks) {
			const pipeTokens: Token[][] = [];
			let currentPipe: Token[] = [];

			// Split by pipe operators
			for (const token of logicalBlock.tokens) {
				if (token.type === 'operator' && token.value === '|') {
					pipeTokens.push(currentPipe);
					currentPipe = [];
				} else {
					currentPipe.push(token);
				}
			}

			if (currentPipe.length > 0) {
				pipeTokens.push(currentPipe);
			}

			// Parse each command in the pipeline
			const commands = pipeTokens.map(cmdTokens => parseCommand(cmdTokens));

			pipelines.push({
				commands,
				operator: logicalBlock.operator
			});
		}

		// Add semicolon operator to the last pipeline in this block
		if (pipelines.length > 0) {
			// Only add the semicolon operator if this isn't the last block
			if (semicolonBlocks.indexOf(block) < semicolonBlocks.length - 1) {
				pipelines[pipelines.length - 1].operator = ';';
			}
		}
	}

	return { pipelines };
}
	