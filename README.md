# Rojo UI
An explorer & properties view for Rojo integrated into Visual Studio Code designed to bring a more familiar experience to Roblox development on your filesystem.

### Disclaimers & Issues
You can view all open issues [here](https://github.com/Muoshuu/rojo-ui/issues).

#### This extension is currently partially incompatible with the Rojo extension for VS Code on Windows.
You can read about the specifics [here](https://github.com/Muoshuu/rojo-ui/issues/1). I'm working on fixing this, but it might take some time. For now, the only workaround is to use the Rojo CLI instead of the Rojo extension.

#### This extension is not complete.
I'm currently waiting for Rojo's two-way sync API to be stable before adding any additional functionality.

#### This extension relies on Rojo to open files.
As of writing, Rojo will always use your default editor to open files, so make sure your default editor for `.lua` files is Visual Studio Code. You can see how to change it [here](https://devforum.roblox.com/t/rojo-ui-vsc-extension/635966/10).

### FAQ

#### What version of Rojo does this extension require?
6.0.0rc1

#### Why should I use this? How does it benefit me?
There is no real benefit to using this extension. It does not offer anything that would speed up development. As of writing, this extension is purely for aesthetics.

#### When I click a script, nothing happens, or something like notepad opens. What gives?
This extension relies on Rojo to open files. As of writing, Rojo will **always** use your default text editor to open any files. I cannot change this. Also, any scripts inside of a `.rbxm` file cannot be opened.

[Here's](https://devforum.roblox.com/t/rojo-ui-vsc-extension/635966/10) a guide on how to change your default editor.

#### How do I use this extension?
Install it from the [VS Code extension marketplace](https://marketplace.visualstudio.com/items?itemName=muoshuu.rojo-ui), then click the Rojo icon in the activity bar.

#### Why don't I see my entire place in the explorer?
This extension relies entirely on Rojo for any information it receives, and Rojo only has information on the instances it manages. For this reason, it is impossible to show any instances that are not managed by Rojo. To make Rojo manage an instance, it must be defined in Rojo's project config.

#### Why are the values of some properties things like `Unknown BrickColor value`?
As with the above answer, this means that Rojo does not have information on the value of that property. Usually, this only occurs with values that are based on other properties (like how Part.BrickColor is based on Part.Color).

#### Why are some of the values of properties incorrect?
For any properties that Rojo doesn't have any information on, this extension will attempt to show the default value that Roblox applies. This might be different from the actual value, and if no default value exists, the value will show up as `Unknown VALUE_TYPE value`.

#### What features are currently available?
As Rojo's two-way sync API is not complete, this extension currently has very little functionality. The things that you can do are as follows:
- Open & save scripts, local scripts, and module scripts.
- View properties that Rojo knows about (aka "defined in Rojo's project config").
- Custom class icons for those of you that want a more modern appearance.

#### How do I use custom icons?
Open the extension's configuration and set the `Icon Folder` field to the absolute path of the directory containing your icons. Note that the icons must be `.png` files and must be named the same as the class.

After doing the above, restart VS Code by either closing and re-opening the application or pressing Ctrl/⌘ + R.

***If you have additional questions, feel free to reach out to me at <admin@muoshuu.me>***
