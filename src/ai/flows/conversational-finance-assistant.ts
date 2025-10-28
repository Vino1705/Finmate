
'use server';

/**
 * @fileOverview An AI-powered chatbot for answering financial queries, simulating scenarios, and providing role-specific budgeting tips.
 *
 * - conversationalFinanceAssistant - A function that handles user interactions and provides financial advice.
 * - ConversationalFinanceAssistantInput - The input type for the conversationalFinanceAssistant function.
 * - ConversationalFinanceAssistantOutput - The return type for the conversationalFinanceAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalFinanceAssistantInputSchema = z.object({
  query: z.string().describe('The user query related to financial advice or scenario.'),
  role: z
    .enum(['Student', 'Professional', 'Housewife'])
    .describe('The user role for tailored advice.'),
  income: z.number().describe('The user income.'),
  fixedExpenses: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .describe('The user fixed expenses.'),
  dailySpendingLimit: z.number().describe('The user daily spending limit.'),
  savings: z.number().describe('The user savings.'),
});
export type ConversationalFinanceAssistantInput = z.infer<
  typeof ConversationalFinanceAssistantInputSchema
>;

const ConversationalFinanceAssistantOutputSchema = z.object({
  response: z.string().describe('The response from the AI chatbot.'),
});
export type ConversationalFinanceAssistantOutput = z.infer<
  typeof ConversationalFinanceAssistantOutputSchema
>;

export async function conversationalFinanceAssistant(
  input: ConversationalFinanceAssistantInput
): Promise<ConversationalFinanceAssistantOutput> {
  return conversationalFinanceAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalFinanceAssistantPrompt',
  input: {schema: ConversationalFinanceAssistantInputSchema},
  output: {schema: ConversationalFinanceAssistantOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a helpful and friendly AI financial assistant called FinMate. Your goal is to provide clear, actionable financial advice based on the user's specific situation.

You will be given a user's profile, their financial context, and a specific query. Analyze all this information to provide a comprehensive response.

## User Profile
- **Role:** {{{role}}}

## Financial Context
- **Monthly Income:** ₹{{{income}}}
- **Fixed Monthly Expenses (Needs):**
{{#each fixedExpenses}}
  - {{name}}: ₹{{amount}}
{{/each}}
- **Suggested Daily Spending Limit (Wants):** ₹{{{dailySpendingLimit}}}
- **Total Savings (for goals, etc.):** ₹{{{savings}}}

## Instructions
1.  **Acknowledge the User's Query:** Start by rephrasing or acknowledging their question.
2.  **Analyze and Calculate:** Based on the financial context, perform any necessary calculations to answer their query. For example, if they ask if they can afford something, check it against their daily or monthly "Wants" budget.
3.  **Provide a Clear Answer:** Give a direct answer to their question (e.g., "Yes, you can afford that," or "That might be a stretch right now.").
4.  **Give Actionable Advice:** Offer specific, role-based tips. For example, suggest ways a 'Student' can save money on textbooks, or how a 'Professional' might optimize their investments.
5.  **Maintain a Positive and Encouraging Tone:** Always be supportive. The goal is to empower the user, not to criticize them.

## User Query
"{{{query}}}"

Based on all the information and instructions above, generate a helpful response.`,
});

const conversationalFinanceAssistantFlow = ai.defineFlow(
  {
    name: 'conversationalFinanceAssistantFlow',
    inputSchema: ConversationalFinanceAssistantInputSchema,
    outputSchema: ConversationalFinanceAssistantOutputSchema,
  },
  async (input: ConversationalFinanceAssistantInput) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output.');
      }
      return output;
    } catch (error) {
      console.error('Error in conversationalFinanceAssistantFlow:', error);
      return {
        response:
          'Sorry, I am having trouble connecting to my knowledge base right now. Please try again in a moment.',
      };
    }
  }
);
