# Rojo UI
A VS Code extension designed to bring a more familiar experience to Roblox development with Rojo.

### FAQ

#### What version of Rojo does this extension require?
6.0.0rc1

#### Why should I use this? How does it benefit me?
There is no real benefit to using this extension. It does not offer anything that would speed up development. As of writing, this extension is purely for aesthetics.

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
Open the extension's configuration and set the `Icon Folder` field to the absolute path of the directory containing your icons. Note that the icons must be `.png` files and must be named exactly the same as the class. For example, `Part.png` works, but `part.png` does not.

After doing the above, restart VS Code by either closing and re-opening the application or pressing Ctrl/⌘ + R.

***If you have additional questions, feel free to reach out to me at <admin@muoshuu.me>***