
'use server';

/**
 * @fileOverview Provides AI-powered spending alerts based on user's past spending.
 *
 * - getSpendingAlerts - A function that provides proactive alerts on spending habits.
 * - SpendingAlertsInput - The input type for the getSpendingAlerts function.
 * - SpendingAlertsOutput - The return type for the getSpendingAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingAlertsInputSchema = z.object({
  income: z.number().describe("The user's monthly income."),
  role: z.enum(['Student', 'Professional', 'Housewife']).describe("The user's role for personalized suggestions."),
  goals: z.array(z.object({
    name: z.string(),
    targetAmount: z.number(),
    monthlyContribution: z.number(),
  })).describe("The user's financial goals."),
  expensesData: z.array(z.object({
      amount: z.number(),
      category: z.string(),
      date: z.string(),
  })).describe('Historical expenses data.'),
});
export type SpendingAlertsInput = z.infer<typeof SpendingAlertsInputSchema>;

const SpendingAlertsOutputSchema = z.object({
  suggestion: z.string().describe('A suggestion for the next week based on spending trends.'),
});
export type SpendingAlertsOutput = z.infer<typeof SpendingAlertsOutputSchema>;

export async function getSpendingAlerts(input: SpendingAlertsInput): Promise<SpendingAlertsOutput> {
  return spendingAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingAlertsPrompt',
  input: {schema: SpendingAlertsInputSchema},
  output: {schema: SpendingAlertsOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are FinMate's proactive financial analyst. Your job is to analyze a user's spending habits and provide a concise, actionable suggestion for the next week.

## User's Financial Profile:
- **Role:** {{{role}}}
- **Monthly Income:** ₹{{{income}}}
- **Financial Goals:**
{{#each goals}}
  - Save for '{{name}}' (Target: ₹{{targetAmount}}, Monthly Contribution: ₹{{monthlyContribution}})
{{/each}}

## User's Recent Spending History:
{{#each expensesData}}
- **Date:** {{date}}
  - **Category:** {{category}}
  - **Amount:** ₹{{amount}}
{{/each}}

## Your Task:
Based on all the information above, generate a single, concise, and actionable suggestion for the upcoming week.

1.  **Analyze Spending Patterns:** Look at the user's recent spending. Identify the single category where they spend the most.
2.  **Connect to Goals:** Briefly mention how adjusting this spending can help them reach a goal faster.
3.  **Create Role-Specific Forward-Looking Suggestions:** 
    - For **Students**: Suggest free alternatives, student discounts, or budget-friendly options. Focus on small changes that don't impact lifestyle drastically.
    - For **Professionals**: Suggest optimization and reallocation strategies. Don't restrict, but encourage smarter choices (meal prep vs dining out, carpooling vs solo commute).
    - For **Housewives**: Suggest bulk buying, seasonal planning, or community resources. Focus on maximizing household efficiency.

**Example Suggestions:**
- **Student:** "To reach your 'Laptop' goal faster, try using student discounts or open-source alternatives for your 'Education' expenses this week. Even ₹500 saved helps!"
- **Professional:** "Reallocate 10% of your 'Food & Dining' budget to meal prep this week — you'll save ₹2000 monthly and hit your 'Vacation' goal 2 months earlier!"
- **Housewife:** "Buy groceries in bulk this week to reduce 'Groceries' expenses by 15%. Seasonal vegetables are cheaper and help your 'Kids Education' fund grow faster!"

Now, generate the 'suggestion' field based on your analysis of the user's data.`,
});

const spendingAlertsFlow = ai.defineFlow(
  {
    name: 'spendingAlertsFlow',
    inputSchema: SpendingAlertsInputSchema,
    outputSchema: SpendingAlertsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output for spending alerts.');
      }
      return output;
    } catch (error) {
      console.error('Error in spendingAlertsFlow:', error);
      return {
        suggestion: 'The AI service is temporarily unavailable. Please try again later.',
      };
    }
  }
);
