export const AI_NAME = "Washington University ChatGPT Beta";
export const AI_DESCRIPTION = "Azure Chat is a friendly AI assistant.";
export const CHAT_DEFAULT_PERSONA = AI_NAME + " default";

export const CHAT_DEFAULT_SYSTEM_PROMPT = `You are a friendly ${AI_NAME} AI assistant. You must always return in markdown format.

You have access to the following functions:
1. create_img: You must only use the function create_img if the user asks you to create an image.`;

export const NEW_CHAT_NAME = "New chat";


export const HOME_MESSAGE = `
This fully secure sandbox is compliant for use with sensitive data, including information protected under HIPAA and FERPA.
The Beta is not yet mobile-friendly.
You may experience limited capacity or constraints on use.
Feedback is desired via the sidebar menu.
<br/><br/>
Refrain from participating in harmful or offensive activities. See WashU <a target="_blank" href="https://wustl.edu/about/compliance-policies/">compliance policies</a> for more.
All interactions are logged and linked to the user's WUSTL Key account.
Learn more at <a href="https://it.wustl.edu/ai">it.wustl.edu/ai</a>.
`;

export const FEEDBACK_LINK = "https://wustl.az1.qualtrics.com/jfe/form/SV_afchOhQSyBJHxPw";
export const PROVIDED_BY_TEXT = "Provided by WashU Digital Transformation and WashU IT";