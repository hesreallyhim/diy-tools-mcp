# diy-tools-mcp

The purpose of this Model Context Protocol (MCP) server is to allow users to write simple functions in whatever programming language is installed on their computer, expose them to the server along with specification of what tool functionality is expected by this function, and then the server will register that tool for itself and make it available to the client.

Before MCP, and with certain other frameworks, users could expose tools directly to the client or host application, just by defining a function. Because of MCP, most host applications use MCP to expose tools to the client, and the ability to write a straightforward tool definition and expose it manually does not seem to be supported, outside of DIY frameworks like LangChain, e.g.

This is an MCP server that has one single tool to start with: `add_tool`. Users may invoke `add_tool` along with the specification of a function, which is written to a local file, and the server will validate the function, and then register it and add it as a new tool, and then submitted a `tools/listChanged` notification.

It is written in TypeScript using the latest version of the MCP TypeScript SDK.
