type Dictionary<T> = {
	[key: string]: T
};

type RbxType = {
	Name: string,
	Category: string
};

type RbxSecurityTag =
	'None' | 'LocalUserSecurity' | 'PluginSecurity' |
	'RobloxScriptSecurity' | 'RobloxSecurity' | 'NotAccessibleSecurity'
;

type RbxMember = {
	Name: string,
	Category: string,
	MemberType: string,
	Security: { Read: RbxSecurityTag, Write: RbxSecurityTag } | RbxSecurityTag,
	Serialization: { CanSave: boolean, CanLoad: boolean },
	ValueType?: RbxType,
	ReturnType?: RbxType,
	Parameters?: { Name: string, Type: RbxType }[],
	Tags?: string[],
	DefaultValue?: RbxProperty
};

type RbxProperty = {
	Type: string,
	Value: any
};

type RbxProperties = {
	[propertyName: string]: RbxProperty
};

type RbxClass = {
	Name: string,
	MemoryCategory: string,
	Superclass: string,
	Tags?: string[],
	Members: RbxMember[],
	DefaultProperties?: { [propertyName: string]: RbxProperty },
	SortOrder: number,
	ImageIndex: number,
	Summary?: string,
	ClassCategory?: string
};

type RbxEnumItem = {
	Name: string,
	Value: number,
	Description?: string,
	IsBrowsable?: boolean,
	IsDeprecated?: boolean
};

type RbxEnum = {
	Name: string,
	Description?: string,
	IsDeprecated?: boolean,
	Items: RbxEnumItem[]
};

type RbxAPI = {
	Classes: RbxClass[];
	Enums?: RbxEnum[];
	Version: number | [ number, number, number, number ]
};

type RbxReflection = {
	api: RbxAPI,
	defaults: RbxAPI,
	iconIndex: IconIndex
};

type RojoInstance = {
	Id: string,
	Parent?: string,
	Name: string,
	ClassName: string,
	Properties: RbxProperties,
	Children: string[],
	Metadata: Dictionary<any>
};

type RojoResponse = {
	sessionId: string,
	messageCursor?: number,
	instances?: {
		[instanceId: string]: RojoInstance
	}
};

type RojoSessionData = {
	sessionId: string,
	serverVersion: string,
	protocolVersion: number,
	rootInstanceId: string,
	expectedPlaceIds?: number[]
};

type IconPathIndex = {
	[className: string]: string
};

type IconIndex = {
	[className: string]: number
};

type Fn = (...args: any[]) => any;