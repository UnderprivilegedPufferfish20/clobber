"use client";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EdgeFunctionType } from "@/lib/types";
import { Editor } from "@monaco-editor/react";
import { ArrowLeftIcon, Edit2Icon, EditIcon, EllipsisVerticalIcon, FileIcon, FilePlus2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

export default function CreateEdgeFunctionPage({

}: {

}) {
    
    const router = useRouter()

    const [edgeFunc, setEdgeFunc] = useState<EdgeFunctionType>({
        createdAt: "",
        deploymentCount: 0,
        files: [ { name: "index.ts", code: "" } ],
        slug: '',
        updatedAt: "",
        url: ""
    })

    const [selectedFile, setSelectedFile] = useState<{ name: string, code: string }>({ name: "index.ts", code: "" })
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newFileName, setNewFileName] = useState("")


    const currentFileNames = useMemo(() => {
        return new Set(edgeFunc.files.map(f => f.name.split(".")[0]))
    }, [edgeFunc.files])

    const { theme } = useTheme()

     const editorRef = useRef<any>(null);

    function handleEditorDidMount(editor: any) {
        editorRef.current = editor;
    }

    const AddFileAction= () => {
        setEdgeFunc(prev => ({
            ...prev,
            files: [...prev.files, { name: `${newFileName}.ts`, code: "" }]
        }));
        setNewFileName(""); // Reset input
        setIsCreateDialogOpen(false)
    }

    useEffect(() => {
        if (selectedFile) return;
        setSelectedFile({ name: "index.ts", code: "" })
    })

    useEffect(() => {
        setSelectedFile(edgeFunc.files.at(-1)!)
    }, [edgeFunc.files])


    return (
        <>
            <div className="fullscreen flex-1 flex">
                <aside className="dark:bg-white/5 bg-black/80 flex flex-col border-r-2 w-1/4 min-w-1/4 max-w-1/4">
                    <div className="flex items-center gap-2 text-sm p-4 text-white">
                        <ArrowLeftIcon 
                            onClick={() => router.back()}
                            className="cursor-pointer h-4 w-4 stroke-white"
                        />
                        <h3 className="text-white text-xl">Create Edge Function</h3>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-2xl">Files</h1>
                        <Button
                            variant={"outline"}
                            className="flex items-center gap-2"
                         
                            onClick={() => setIsCreateDialogOpen(true)}
                        >

                            <FilePlus2Icon className="w-8 h-8"/>
                            Add File
                        </Button>
                    </div>
                    {edgeFunc.files.map((e, index) => {
                        return (
                            <SidebarFile 
                                func={e}
                                index={index}
                                selectedFile={selectedFile}
                                setEdgeFunc={setEdgeFunc}
                                setSelectedFile={setSelectedFile}
                                key={e.name}
                                currentFileNames={currentFileNames}
                                edgeFunc={edgeFunc}
                            />
                        )
                    })}
                </aside>

                <div className="flex-1 overflow-hidden min-h-0 min-w-0">
                    <Editor
                        onMount={handleEditorDidMount}
                        height="100%"
                        key={selectedFile.name} // Force re-mount when file changes
                        path={selectedFile.name} 
                        language="typescript"
                        theme={theme === "dark" ? "vs-dark" : "light"}
                        value={selectedFile.code}
                        onChange={(value) => {
                            const newCode = value ?? "";
                            setSelectedFile(prev => ({ ...prev, code: newCode }));
                            
                            // Note: You likely also want to update the file inside edgeFunc state here 
                            // so the changes persist when switching files.
                            setEdgeFunc(prev => ({
                                ...prev,
                                files: prev.files.map(f => 
                                    f.name === selectedFile.name ? { ...f, code: newCode } : f
                                )
                            }));
                        }}
                        options={{
                            automaticLayout: false,
                            minimap: { enabled: true },
                            wordWrap: "on",
                            scrollBeyondLastLine: true,
                        }}
                    />
                </div>

            </div>

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogContent>
                    <CustomDialogHeader 
                        icon={FilePlus2Icon}
                        title="Add file to edge function"
                    />

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" >Name</Label>
                        <Input
                            className={`${currentFileNames.has(newFileName) && "border border-red-500! focus:border-red-500! focus:ring-red-500! rounded-md p-2"}`}
                            value={newFileName}
                            onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                AddFileAction()
                            }
                            }}
                            onChange={e => setNewFileName(e.target.value)} 
                            id="name"
                        />
                        {currentFileNames.has(newFileName) && (
                            <p className="text-md text-red-400">File with that name already exists</p>
                        )}
                        {newFileName.includes(".") && (
                            <p className="text-md text-red-400">All files are typescript (.ts) and cannot contain dots</p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button
                            variant={'outline'}
                        >
                            Cancel
                        </Button>
                        </DialogClose>

                        <Button
                            onClick={AddFileAction}
                            disabled={currentFileNames.has(newFileName) || newFileName.includes(".")}
                        >
                            Create File
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}


function SidebarFile({
    selectedFile,
    setSelectedFile,


    func,

    edgeFunc,
    setEdgeFunc,
    currentFileNames,
    index
}: {
    selectedFile: { name: string, code: string },
    currentFileNames: Set<string>,
    func: { name: string, code: string },
    setSelectedFile: Dispatch<SetStateAction<{ name: string, code: string }>>
    setEdgeFunc: Dispatch<SetStateAction<EdgeFunctionType>>,
    edgeFunc: EdgeFunctionType,
    index: number
}) {

    const [renameOpen, setRenameOpen] = useState(false)
    const [newName, setNewName] = useState("")

    const renameFileAction = () => {
        setEdgeFunc(prev => {
            // Map creates a new array (immutability)
            const updatedFiles = prev.files.map((file, idx) => {
                if (idx !== index) return file;
                
                // Return a new object for the renamed file
                return { ...file, name: `${newName}.ts` };
            });

            return { ...prev, files: updatedFiles };
        });

        // 3. Keep selectedFile in sync if the file being renamed is the active one
        if (selectedFile.name === func.name) {
            setSelectedFile(prev => ({ ...prev, name: `${newName}.ts` }));
        }

        setNewName("");
        setRenameOpen(false);
    };



    return (
        <>
        
            <div 
                onClick={() => {
                    setSelectedFile({ name: func.name, code: func.code })
                }}
                className={`cursor-pointer hover:bg-white/10 gap-2 flex items-center p-2 justify-between ${func.name === selectedFile.name && "dark:bg-white/30 border-l-4 border-white"}`}
            >
                <div className="flex items-center gap-4">
                    <FileIcon className="w-6 h-6"/>
                    <h2>{func.name}</h2>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <EllipsisVerticalIcon className="w-4 h-4"/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation()
                                setRenameOpen(true)
                            }}
                        >
                            <EditIcon className="w-6 h-6"/>
                            Rename
                        </DropdownMenuItem>
                        {func.name !== "index.ts" && (
                            <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem 
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                        setEdgeFunc(prev => ({
                                            ...prev,
                                            files: prev.files.filter((_, idx) => idx !== index)
                                        }));
                                    }}
                                >
                                    <Trash2Icon className="w-6 h-6"/>
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
            >   
                <DialogContent>
                    <CustomDialogHeader 
                        icon={Edit2Icon}
                        title={`Rename ${func.name}`}
                    />

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" >New Name</Label>
                        <Input
                            className={`${currentFileNames.has(newName) && "border border-red-500! focus:border-red-500! focus:ring-red-500! rounded-md p-2"}`}
                            value={newName}
                            onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                renameFileAction()
                            }
                            }}
                            onChange={e => setNewName(e.target.value)} 
                            id="name"
                        />
                        {currentFileNames.has(newName) && (
                            <p className="text-md text-red-400">File with that name already exists</p>
                        )}
                        {newName.includes(".") && (
                            <p className="text-md text-red-400">All files are typescript (.ts) and cannot contain dots</p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button
                            variant={'outline'}
                        >
                            Cancel
                        </Button>
                        </DialogClose>

                        <Button
                            onClick={renameFileAction}
                            disabled={currentFileNames.has(newName) || newName.includes(".")}
                        >
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}