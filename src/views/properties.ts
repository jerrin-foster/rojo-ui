import * as vscode from 'vscode';
import { Item } from './explorer';

const hiddenMembers = [
    'Source', 'className', 'RobloxLocked', 'Parent', 'ClassName', 'Name',
    'ResizeIncrement', 'ResizeableFaces', 'Terrain',
    'Archivable', 'TemporaryLegacyPhysicsSolverOverride', 'PrimaryPart',
    'CurrentCamera', 'Mass', 'CenterOfMass', 'MaxExtents', 'CurrentEditor',
    'IsDifferentFromFileSystem', 'RotVelocity', 'LinkedSource' ];

const terrainShownMembers = [
    'MaterialColors', 'Decoration', 'WaterColor', 'WaterReflectance',
    'WaterTransparency', 'WaterWaveSize', 'WaterWaveSpeed',
    'CollisionGroupId', 'CustomPhysicalProperties'
];

function getClass(api: RbxAPI, className: string): RbxClass | undefined {
    for (let rbxClass of Object.values(api.Classes)) {
        if (rbxClass.Name === className) {
            return rbxClass;
        }
    }
}

function getMember(api: RbxAPI, className: string, memberName: string): RbxMember | undefined {
    let rbxClass = getClass(api, className);

    if (rbxClass) {
        for (let member of rbxClass.Members) {
            if (member.Name === memberName) {
                return member;
            }
        }
    }
}

function getMembers(api: RbxAPI, className: string): RbxMember[] {
    let rbxClass = getClass(api, className);

    if (rbxClass) {
        let members = [];

        for (let member of rbxClass.Members) {
            members.push(member);
        }

        let superClass = getClass(api, rbxClass.Superclass);
        
        if (superClass) {
            let inherited = getMembers(api, superClass.Name);

            for (let member of inherited) {
                let found = false;

                for (let member2 of members) {
                    if (member2.Name === member.Name) {
                        found = true;
                    }
                }

                if (!found) {
                    members.push(member);
                }
            }
        }

        return members;
    } else {
        return [];
    }
}

function getEnum(api: RbxAPI, enumName: string): RbxEnum | undefined {
    if (api.Enums) {
        for (let rbxEnum of api.Enums) {
            if (rbxEnum.Name === enumName) {
                return rbxEnum;
            }
        }
    }
}

function getEnumItem(api: RbxAPI, enumName: string, enumValue: string | number): RbxEnumItem | undefined {
    let rbxEnum = getEnum(api, enumName);
    
    if (rbxEnum) {
        for (let rbxEnumItem of rbxEnum.Items) {
            if (rbxEnumItem.Name === enumValue || rbxEnumItem.Value === enumValue) {
                return rbxEnumItem;
            }
        }
    }
}

function getDefaultValue(api: RbxAPI, className: string, memberName: string): RbxProperty | undefined {
    let rbxClass = getClass(api, className);
    let rbxMember = getMember(api, className, memberName);

    if (rbxClass) {
        let defaultValue = rbxMember ? rbxMember.DefaultValue : undefined;
        
        if (!defaultValue) {
            defaultValue = getDefaultValue(api, rbxClass.Superclass, memberName);
        }

        return defaultValue;
    }
}

export class Property extends vscode.TreeItem {
    constructor (
        public label: string,
        public state: number | vscode.TreeItemCollapsibleState,
        public type: string,
        public value: any,
        public children?: Property[],
        public enumString?: string,
        public iconPath?: string

    ) {
        super(label, state);
    }

    get tooltip(): string {

        return this.description;
    }

    get description(): string {
        let val = this.value;

        if (val === 'unknown') {
            return `Unknown ${this.type} value`;
        }

        switch (this.type) {
            case 'Color3':
                return `${Math.floor(val[0] * 255)}, ${Math.floor(val[1] * 255)}, ${Math.floor(val[2] * 255)}`;
            
            case 'Vector2':
                return `${val[0]}, ${val[1]}`;

            case 'Vector3':
                return `${val[0]}, ${val[1]}, ${val[2]}`;
            
            case 'CFrame':
                return `${val.Position[0]}, ${val.Position[1]}, ${val.Position[2]}, ` +
                       `${val.Orientation[0][0]}, ${val.Orientation[0][1]}, ${val.Orientation[0][2]}, ` +
                       `${val.Orientation[1][0]}, ${val.Orientation[1][1]}, ${val.Orientation[1][2]}, ` +
                       `${val.Orientation[2][0]}, ${val.Orientation[2][1]}, ${val.Orientation[2][2]}`;
            
            case 'Float32':
            case 'Float64':
            case 'float':
                if (val%1 === 0) {
                    return `${val}.0`;
                } else {
                    return `${Math.floor(val*1000)/1000}`;
                }
            
            case 'Enum':
            case 'EnumValue':
                if (this.enumString) {
                    return 'Enum.' + this.enumString;
                }

            default:
                return val.toString();
        }
    }
}

export class PropertiesProvider implements vscode.TreeDataProvider<Property> {
    constructor (
        public context: vscode.ExtensionContext
    ) {}

    public currentItem?: Item;
    private rbxAPI: RbxAPI = { Classes: [], Version: 0 };

    private _onDidChangeTreeData = new vscode.EventEmitter<Property | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    set api(dump: RbxReflection) {
        for (let rbxClass of Object.values(dump.api.Classes)) {
            let classDefaults = getClass(dump.defaults, rbxClass.Name);

            if (classDefaults) {
                rbxClass.DefaultProperties = classDefaults.DefaultProperties;
                rbxClass.Members = getMembers(dump.api, rbxClass.Name);

                if (classDefaults.DefaultProperties) {
                    for (let member of rbxClass.Members) {
                        let defaultValue = classDefaults.DefaultProperties[member.Name];

                        if (defaultValue) {
                            member.DefaultValue = defaultValue;
                        }
                    }
                }
            }
        }

        this.rbxAPI = dump.api;
    }
    
    getTreeItem(item: Property): Property {
        return item;
    }

    getChildren(item?: Property): Promise<Property[]> {
        return new Promise(async resolve => {
            if (this.currentItem?.instance.ClassName === 'DataModel' || !this.currentItem) {
                return resolve([
                    //this.noProperties
                ]);
            } else if (this.currentItem) {
                let instance = this.currentItem.instance;

                if (item) { // Properties
                    item.children?.sort((a, b) => {
                        if (a.label > b.label) {
                            return 1;
                        } else if (a.label < b.label) {
                            return -1;
                        }

                        return 0;
                    });

                    resolve(item.children);
                } else { // Categories
                    let categories: { [category: string]: Property } = {};
                    let inherited = getMembers(this.rbxAPI, instance.ClassName);

                    for (let member of inherited) {
                        let isHidden: boolean = false, isDeprecated: boolean = false;
                        
                        if (member.Tags) {
                            isHidden = member.Tags.indexOf('Hidden') >= 0;
                            isDeprecated = member.Tags.indexOf('Deprecated') >= 0;
                        }

                        if (!(isHidden || isDeprecated || member.MemberType === 'Function' || member.MemberType === 'Event' || hiddenMembers.indexOf(member.Name) >= 0)) {
                            if (!((instance.ClassName === 'Terrain' && terrainShownMembers.indexOf(member.Name) >= 0) || instance.ClassName !== 'Terrain')) {
                                continue;
                            }

                            let category = categories[member.Category];
        
                            if (!category) {
                                category = new Property(member.Category, 2, 'Category', '', []); categories[member.Category] = category;
                            }

                            let value = getDefaultValue(this.rbxAPI, instance.ClassName, member.Name);

                            for (let name in instance.Properties) {
                                if (name === member.Name) {
                                    value = instance.Properties[name];
                                }
                            }

                            let enumItemName: string | undefined; {
                                if (member.ValueType?.Category === 'Enum') {
                                    let enumName = member.ValueType?.Name;

                                    if (enumName) {
                                        let enumItem = getEnumItem(this.rbxAPI, enumName, value?.Value || 0);

                                        if (enumItem) {
                                            enumItemName = enumName + '.' + enumItem.Name;
                                        }
                                    }
                                }
                            }

                            if (category.children) {
                                if (!value) {
                                    if (member.Name === 'ClassName') {
                                        value = { Type: 'String', Value: instance.ClassName };
                                    } else if (member.Name === 'Name') {
                                        value = { Type: 'String', Value: instance.Name };
                                    } else {
                                        let type = member.ValueType?.Name;

                                        if (member.ValueType?.Category === 'Enum') {
                                            type = 'Enum.' + type;
                                        }

                                        value = { Type: type || 'unknown', Value: 'unknown' };
                                    }
                                }

                                category.children.push(new Property(member.Name, 0, value.Type, value.Value, undefined, enumItemName));
                            }
                        }
                    }

                    for (let name in categories) {
                        if (categories[name].children?.length === 0) {
                            delete categories[name];
                        }
                    }

                    let children = Object.values(categories);

                    children.sort((a, b) => {
                        if (a.label > b.label) {
                            return 1;
                        } else if (a.label < b.label) {
                            return -1;
                        }

                        return 0;
                    });

                    if (!children.length) {
                        //children.push(this.noProperties);
                    }

                    resolve(children);
                }
            }
        });
    }

    refresh(item?: Item) {
        this.currentItem = item;
        this._onDidChangeTreeData.fire();
    }

    //private noProperties: Property = new Property('No properties to show', 0, '', '', undefined, undefined);
}

export function handler(context: vscode.ExtensionContext) {
    const provider = new PropertiesProvider(context);

    vscode.window.createTreeView('rojo-ui.view.properties', {
        treeDataProvider: provider
    });
    
    return provider;
}