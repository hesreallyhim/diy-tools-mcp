import { default as Ajv } from 'ajv';
import { JSONSchema7 } from 'json-schema';
import {
  FunctionSpecification,
  ValidationError,
  isFileBasedFunction,
  isInlineFunction,
  FunctionArgs,
} from '../types/index.js';
import { getExecutor, isSupportedLanguage } from '../utils/language.js';
import { TIMEOUTS } from '../constants.js';

const AjvConstructor = Ajv as unknown as typeof Ajv.default;
const ajv = new AjvConstructor({ strict: false });

export class FunctionValidator {
  async validate(spec: FunctionSpecification): Promise<void> {
    // Validate basic fields
    if (!spec.name || typeof spec.name !== 'string') {
      throw new ValidationError('Function name is required and must be a string');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(spec.name)) {
      throw new ValidationError(
        'Function name must start with a letter and contain only letters, numbers, and underscores'
      );
    }

    if (!spec.description || typeof spec.description !== 'string') {
      throw new ValidationError('Function description is required and must be a string');
    }

    if (!spec.language || typeof spec.language !== 'string') {
      throw new ValidationError('Function language is required and must be a string');
    }

    if (!isSupportedLanguage(spec.language)) {
      throw new ValidationError(
        `Unsupported language: ${spec.language}. Supported languages are: python, javascript, typescript, bash, ruby, node`
      );
    }

    // Validate code/codePath mutual exclusivity
    if (!isInlineFunction(spec) && !isFileBasedFunction(spec)) {
      if (spec.code && spec.codePath) {
        throw new ValidationError('Function cannot have both code and codePath - use exactly one');
      } else {
        throw new ValidationError(
          'Function must have either code (inline) or codePath (file-based)'
        );
      }
    }

    // Validate code field for inline functions
    if (isInlineFunction(spec)) {
      if (!spec.code || typeof spec.code !== 'string') {
        throw new ValidationError('Inline function code is required and must be a string');
      }
    }

    // Validate codePath field for file-based functions
    if (isFileBasedFunction(spec)) {
      if (!spec.codePath || typeof spec.codePath !== 'string') {
        throw new ValidationError('File-based function codePath is required and must be a string');
      }

      // Validate file extension matches language
      const validExtensions = this.getValidExtensions(spec.language);
      const hasValidExt = validExtensions.some((ext) => spec.codePath!.endsWith(ext));
      if (!hasValidExt) {
        throw new ValidationError(
          `File path must have one of ${validExtensions.join(', ')} extensions for ${spec.language} language`
        );
      }
    }

    if (!spec.parameters || typeof spec.parameters !== 'object') {
      throw new ValidationError('Function parameters schema is required and must be an object');
    }

    // Validate JSON Schema
    this.validateJSONSchema(spec.parameters);

    // Validate the code syntax (only for inline functions)
    if (isInlineFunction(spec)) {
      const executor = getExecutor(spec.language);
      if (!executor) {
        throw new ValidationError(`No executor available for language: ${spec.language}`);
      }

      const validationResult = await executor.validate(spec.code!, spec.entryPoint);
      if (!validationResult.valid) {
        throw new ValidationError(
          `Code validation failed: ${validationResult.errors?.join(', ') || 'Unknown error'}`
        );
      }
    }

    // Validate timeout if provided
    if (spec.timeout !== undefined) {
      if (typeof spec.timeout !== 'number' || spec.timeout <= 0) {
        throw new ValidationError('Timeout must be a positive number');
      }

      if (spec.timeout > TIMEOUTS.MAX_EXECUTION) {
        throw new ValidationError(
          `Timeout cannot exceed ${TIMEOUTS.MAX_EXECUTION / 1000 / 60} minutes (${TIMEOUTS.MAX_EXECUTION}ms)`
        );
      }
    }
  }

  private getExpectedExtension(language: string): string {
    switch (language) {
      case 'python':
        return '.py';
      case 'javascript':
      case 'node':
        return '.js';
      case 'typescript':
        return '.ts';
      case 'bash':
        return '.sh';
      case 'ruby':
        return '.rb';
      default:
        return '';
    }
  }

  private getValidExtensions(language: string): string[] {
    switch (language) {
      case 'python':
        return ['.py'];
      case 'javascript':
      case 'node':
        return ['.js', '.mjs', '.cjs'];
      case 'typescript':
        return ['.ts'];
      case 'bash':
        return ['.sh'];
      case 'ruby':
        return ['.rb'];
      default:
        return [];
    }
  }

  private validateJSONSchema(schema: JSONSchema7): void {
    // Ensure it's a valid JSON Schema
    if (schema.type !== 'object') {
      throw new ValidationError('Parameters schema must have type "object"');
    }

    // Compile the schema to check if it's valid
    try {
      ajv.compile(schema);
    } catch (error) {
      throw new ValidationError(
        `Invalid JSON Schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  validateArguments(schema: JSONSchema7, args: FunctionArgs): void {
    const validate = ajv.compile(schema);

    if (!validate(args)) {
      const errors = validate.errors
        ?.map((err: any) => {
          const path = err.instancePath || 'root';
          return `${path}: ${err.message}`;
        })
        .join(', ');

      throw new ValidationError(`Invalid arguments: ${errors}`);
    }
  }
}
