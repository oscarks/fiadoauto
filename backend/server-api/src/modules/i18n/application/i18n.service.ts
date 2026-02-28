import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

@Injectable()
export class AppI18nService implements OnModuleInit {
  private readonly logger = new Logger(AppI18nService.name);
  private readonly dictionaries = new Map<string, TranslationTree>();

  onModuleInit(): void {
    this.loadDictionary('pt-BR');
  }

  t(key: string, locale = 'pt-BR'): string {
    const dictionary = this.dictionaries.get(locale) ?? this.dictionaries.get('pt-BR');
    if (!dictionary) {
      return key;
    }

    const value = key.split('.').reduce<string | TranslationTree | undefined>((acc, part) => {
      if (!acc || typeof acc === 'string') {
        return undefined;
      }
      return acc[part];
    }, dictionary);

    return typeof value === 'string' ? value : key;
  }

  resolveLocale(acceptLanguage?: string): string {
    if (!acceptLanguage) {
      return 'pt-BR';
    }

    const preferred = acceptLanguage.split(',')[0]?.trim();
    if (!preferred) {
      return 'pt-BR';
    }

    if (preferred.toLowerCase().startsWith('pt')) {
      return 'pt-BR';
    }

    return 'pt-BR';
  }

  private loadDictionary(locale: string): void {
    if (this.dictionaries.has(locale)) {
      return;
    }

    const fileName = `${locale}.json`;
    const filePath = join(__dirname, '..', 'translations', fileName);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const dictionary = JSON.parse(raw) as TranslationTree;
      this.dictionaries.set(locale, dictionary);
    } catch (error) {
      this.logger.warn(`Failed to load translations for locale "${locale}": ${error}`);
    }
  }
}
