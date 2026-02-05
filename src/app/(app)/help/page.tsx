"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Lightbulb, Check } from 'lucide-react';
import { helpSections, searchHelpContent, type HelpSection } from '@/lib/help-content';
import { cn } from '@/lib/utils';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSections, setFilteredSections] = useState<HelpSection[]>(helpSections);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredSections(helpSections);
    } else {
      const results = searchHelpContent(query);
      setFilteredSections(results);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Help & User Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Learn how to make the most of FinMate's features. Find answers, tips, and step-by-step instructions.
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search help topics (e.g., 'goals', 'expenses', 'AI assistant')..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'} matching "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{helpSections.length}</p>
                <p className="text-sm text-muted-foreground">Help Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">50+</p>
                <p className="text-sm text-muted-foreground">Tips & Tricks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">100+</p>
                <p className="text-sm text-muted-foreground">Step-by-Step Guides</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Sections */}
      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try a different search term or browse all sections below.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Click any section to expand and view detailed information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredSections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <span className="font-semibold text-base">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-2 pl-2">
                      {section.content.map((subsection, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-semibold text-base text-foreground">
                            {subsection.heading}
                          </h4>
                          {subsection.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {subsection.description}
                            </p>
                          )}

                          {/* Steps */}
                          {subsection.steps && subsection.steps.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">Steps:</p>
                              <ol className="space-y-2 pl-1">
                                {subsection.steps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="flex gap-3 text-sm text-muted-foreground">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="pt-0.5">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Tips */}
                          {subsection.tips && subsection.tips.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-600" />
                                Tips:
                              </p>
                              <ul className="space-y-2 pl-1">
                                {subsection.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex gap-3 text-sm text-muted-foreground">
                                    <span className="flex-shrink-0 text-primary mt-0.5">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Divider between subsections (except last) */}
                          {index < section.content.length - 1 && (
                            <div className="border-t border-border mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Footer Help Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-base">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Try asking our AI Assistant for personalized help. Click the chat icon in the bottom-right corner to get started. The AI can answer questions specific to your financial data and provide tailored recommendations.
              </p>
              <Badge variant="secondary" className="mt-2">
                💬 AI Assistant available 24/7
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
